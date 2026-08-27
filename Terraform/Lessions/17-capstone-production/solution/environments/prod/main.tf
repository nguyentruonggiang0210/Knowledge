module "stack" {
  source = "../../modules/environment"

  environment          = "prod"
  compartment_id       = var.compartment_id
  name_prefix          = var.name_prefix
  vcn_cidr             = var.vcn_cidr
  enable_nat_gateway   = var.enable_nat_gateway
  enable_compute       = var.enable_compute
  enable_load_balancer = var.enable_load_balancer
  lb_ingress_cidrs     = var.lb_ingress_cidrs
  instances            = var.instances
  ssh_public_key       = var.ssh_public_key
  owner                = var.owner
  cost_center          = var.cost_center
}

