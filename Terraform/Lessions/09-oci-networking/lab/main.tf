locals {
  public_subnet_cidr = cidrsubnet(var.vcn_cidr, 8, 10)
  app_subnet_cidr    = cidrsubnet(var.vcn_cidr, 8, 20)
  tags = {
    environment = "learning"
    managed_by  = "terraform"
    owner       = "student"
  }
}

resource "oci_core_vcn" "main" {
  compartment_id = var.compartment_id
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.name_prefix}-vcn"
  dns_label      = "tfcourse"
  freeform_tags  = local.tags
}

resource "oci_core_internet_gateway" "main" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.name_prefix}-igw"
  enabled        = true
  freeform_tags  = local.tags
}

resource "oci_core_nat_gateway" "main" {
  count = var.enable_nat_gateway ? 1 : 0

  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.name_prefix}-nat"
  freeform_tags  = local.tags
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.name_prefix}-public-rt"
  freeform_tags  = local.tags

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.main.id
  }
}

resource "oci_core_route_table" "private" {
  count = var.enable_nat_gateway ? 1 : 0

  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.name_prefix}-private-rt"
  freeform_tags  = local.tags

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.main[0].id
  }
}

resource "oci_core_subnet" "public_lb" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = local.public_subnet_cidr
  display_name               = "${var.name_prefix}-public-lb"
  dns_label                  = "publb"
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = []
  freeform_tags              = local.tags
}

resource "oci_core_subnet" "private_app" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = local.app_subnet_cidr
  display_name               = "${var.name_prefix}-private-app"
  dns_label                  = "app"
  prohibit_public_ip_on_vnic = true
  route_table_id             = var.enable_nat_gateway ? oci_core_route_table.private[0].id : null
  security_list_ids          = []
  freeform_tags              = local.tags
}

resource "oci_core_network_security_group" "lb" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.name_prefix}-lb-nsg"
  freeform_tags  = local.tags
}

resource "oci_core_network_security_group" "app" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.name_prefix}-app-nsg"
  freeform_tags  = local.tags
}

resource "oci_core_network_security_group_security_rule" "lb_http_ingress" {
  for_each = var.lb_allowed_cidrs

  network_security_group_id = oci_core_network_security_group.lb.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = each.value
  source_type               = "CIDR_BLOCK"
  stateless                 = false
  description               = "Public HTTP only"

  tcp_options {
    destination_port_range {
      min = 80
      max = 80
    }
  }
}

resource "oci_core_network_security_group_security_rule" "app_from_lb" {
  network_security_group_id = oci_core_network_security_group.app.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = oci_core_network_security_group.lb.id
  source_type               = "NETWORK_SECURITY_GROUP"
  stateless                 = false
  description               = "Application traffic from load balancer role"

  tcp_options {
    destination_port_range {
      min = 8080
      max = 8080
    }
  }
}

resource "oci_core_network_security_group_security_rule" "app_egress" {
  network_security_group_id = oci_core_network_security_group.app.id
  direction                 = "EGRESS"
  protocol                  = "all"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  stateless                 = false
  description               = "Lab egress; production phải thu hẹp theo dependency"
}

