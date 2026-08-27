output "network" {
  value = {
    vcn_id             = oci_core_vcn.main.id
    public_subnet_id   = oci_core_subnet.public_lb.id
    private_subnet_id  = oci_core_subnet.private_app.id
    lb_nsg_id          = oci_core_network_security_group.lb.id
    app_nsg_id         = oci_core_network_security_group.app.id
    nat_gateway_opt_in = var.enable_nat_gateway
  }
}

