locals {
  name = "${var.name_prefix}-${var.environment}"
  tags = {
    environment = var.environment
    managed_by  = "terraform"
    owner       = trimspace(var.owner)
    cost_center = trimspace(var.cost_center)
  }
  active_instances = var.enable_compute ? var.instances : {}
}

resource "terraform_data" "safety" {
  input = {
    environment          = var.environment
    enable_compute       = var.enable_compute
    enable_load_balancer = var.enable_load_balancer
  }

  lifecycle {
    precondition {
      condition     = local.tags.owner != "" && local.tags.cost_center != ""
      error_message = "owner và cost_center là bắt buộc."
    }

    precondition {
      condition     = !var.enable_compute || (length(var.instances) > 0 && var.ssh_public_key != null)
      error_message = "Bật compute cần instances và SSH public key."
    }

    precondition {
      condition     = !var.enable_load_balancer || (var.enable_compute && length(var.instances) > 0)
      error_message = "Bật load balancer cần compute backends."
    }

    precondition {
      condition     = var.environment != "prod" || !var.enable_compute || length(var.instances) >= 2
      error_message = "Production compute cần ít nhất hai instance keys."
    }
  }
}

module "network" {
  source = "../network"

  compartment_id     = var.compartment_id
  name_prefix        = local.name
  vcn_cidr           = var.vcn_cidr
  enable_nat_gateway = var.enable_nat_gateway
  lb_ingress_cidrs   = var.lb_ingress_cidrs
  app_port           = var.app_port
  data_port          = var.data_port
  tags               = local.tags
}

module "compute" {
  source = "../compute"

  compartment_id = var.compartment_id
  name_prefix    = local.name
  subnet_id      = module.network.private_app_subnet_id
  nsg_id         = module.network.app_nsg_id
  instances      = local.active_instances
  ssh_public_key = coalesce(var.ssh_public_key, "disabled")
  app_port       = var.app_port
  tags           = local.tags
}

module "load_balancer" {
  count  = var.enable_load_balancer ? 1 : 0
  source = "../load_balancer"

  compartment_id = var.compartment_id
  name_prefix    = local.name
  subnet_id      = module.network.public_lb_subnet_id
  nsg_id         = module.network.lb_nsg_id
  backend_ips    = module.compute.private_ips
  app_port       = var.app_port
  tags           = local.tags
}

