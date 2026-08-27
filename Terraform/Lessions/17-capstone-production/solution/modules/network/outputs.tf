output "vcn_id" {
  value = oci_core_vcn.this.id
}

output "public_lb_subnet_id" {
  value = oci_core_subnet.public_lb.id
}

output "private_app_subnet_id" {
  value = oci_core_subnet.private_app.id
}

output "private_data_subnet_id" {
  value = oci_core_subnet.private_data.id
}

output "lb_nsg_id" {
  value = oci_core_network_security_group.lb.id
}

output "app_nsg_id" {
  value = oci_core_network_security_group.app.id
}

output "data_nsg_id" {
  value = oci_core_network_security_group.data.id
}

