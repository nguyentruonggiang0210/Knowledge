locals {
  public_lb_cidr    = cidrsubnet(var.vcn_cidr, 8, 10)
  private_app_cidr  = cidrsubnet(var.vcn_cidr, 8, 20)
  private_data_cidr = cidrsubnet(var.vcn_cidr, 8, 30)
}

resource "oci_core_vcn" "this" {
  compartment_id = var.compartment_id
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.name_prefix}-vcn"
  dns_label      = substr(replace(var.name_prefix, "-", ""), 0, 15)
  freeform_tags  = var.tags
}

resource "oci_core_internet_gateway" "this" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.name_prefix}-igw"
  enabled        = true
  freeform_tags  = var.tags
}

resource "oci_core_nat_gateway" "this" {
  count = var.enable_nat_gateway ? 1 : 0

  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.name_prefix}-nat"
  freeform_tags  = var.tags
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.name_prefix}-public-rt"
  freeform_tags  = var.tags

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.this.id
  }
}

resource "oci_core_route_table" "private_app" {
  count = var.enable_nat_gateway ? 1 : 0

  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.name_prefix}-private-app-rt"
  freeform_tags  = var.tags

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.this[0].id
  }
}

resource "oci_core_subnet" "public_lb" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.this.id
  cidr_block                 = local.public_lb_cidr
  display_name               = "${var.name_prefix}-public-lb"
  dns_label                  = "publb"
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = []
  freeform_tags              = var.tags
}

resource "oci_core_subnet" "private_app" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.this.id
  cidr_block                 = local.private_app_cidr
  display_name               = "${var.name_prefix}-private-app"
  dns_label                  = "app"
  prohibit_public_ip_on_vnic = true
  route_table_id             = var.enable_nat_gateway ? oci_core_route_table.private_app[0].id : null
  security_list_ids          = []
  freeform_tags              = var.tags
}

resource "oci_core_subnet" "private_data" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.this.id
  cidr_block                 = local.private_data_cidr
  display_name               = "${var.name_prefix}-private-data"
  dns_label                  = "data"
  prohibit_public_ip_on_vnic = true
  security_list_ids          = []
  freeform_tags              = var.tags
}

resource "oci_core_network_security_group" "lb" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.name_prefix}-lb-nsg"
  freeform_tags  = var.tags
}

resource "oci_core_network_security_group" "app" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.name_prefix}-app-nsg"
  freeform_tags  = var.tags
}

resource "oci_core_network_security_group" "data" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.name_prefix}-data-nsg"
  freeform_tags  = var.tags
}

resource "oci_core_network_security_group_security_rule" "lb_public_web" {
  for_each = var.lb_ingress_cidrs

  network_security_group_id = oci_core_network_security_group.lb.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = each.value
  source_type               = "CIDR_BLOCK"
  stateless                 = false
  description               = "Public HTTP for capstone; replace with HTTPS in production"

  tcp_options {
    destination_port_range {
      min = 80
      max = 80
    }
  }
}

resource "oci_core_network_security_group_security_rule" "lb_to_app" {
  network_security_group_id = oci_core_network_security_group.lb.id
  direction                 = "EGRESS"
  protocol                  = "6"
  destination               = oci_core_network_security_group.app.id
  destination_type          = "NETWORK_SECURITY_GROUP"
  stateless                 = false
  description               = "Load balancer to application"

  tcp_options {
    destination_port_range {
      min = var.app_port
      max = var.app_port
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
  description               = "Application only accepts load balancer role"

  tcp_options {
    destination_port_range {
      min = var.app_port
      max = var.app_port
    }
  }
}

resource "oci_core_network_security_group_security_rule" "app_to_data" {
  network_security_group_id = oci_core_network_security_group.app.id
  direction                 = "EGRESS"
  protocol                  = "6"
  destination               = oci_core_network_security_group.data.id
  destination_type          = "NETWORK_SECURITY_GROUP"
  stateless                 = false
  description               = "Application to data role"

  tcp_options {
    destination_port_range {
      min = var.data_port
      max = var.data_port
    }
  }
}

resource "oci_core_network_security_group_security_rule" "data_from_app" {
  network_security_group_id = oci_core_network_security_group.data.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = oci_core_network_security_group.app.id
  source_type               = "NETWORK_SECURITY_GROUP"
  stateless                 = false
  description               = "Data role only accepts application role"

  tcp_options {
    destination_port_range {
      min = var.data_port
      max = var.data_port
    }
  }
}

resource "oci_core_network_security_group_security_rule" "app_https_egress" {
  network_security_group_id = oci_core_network_security_group.app.id
  direction                 = "EGRESS"
  protocol                  = "6"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  stateless                 = false
  description               = "HTTPS dependencies; narrow to service CIDRs where possible"

  tcp_options {
    destination_port_range {
      min = 443
      max = 443
    }
  }
}

