output "network" {
  value = {
    vcn_id                 = module.network.vcn_id
    public_lb_subnet_id    = module.network.public_lb_subnet_id
    private_app_subnet_id  = module.network.private_app_subnet_id
    private_data_subnet_id = module.network.private_data_subnet_id
    data_nsg_id            = module.network.data_nsg_id
  }
}

output "instances" {
  value = module.compute.instances
}

output "load_balancer" {
  value = var.enable_load_balancer ? {
    id           = module.load_balancer[0].id
    ip_addresses = module.load_balancer[0].ip_addresses
  } : null
}

