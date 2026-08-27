output "instances" {
  value = {
    for key, instance in oci_core_instance.this : key => {
      id         = instance.id
      private_ip = instance.private_ip
    }
  }
}

output "private_ips" {
  value = {
    for key, instance in oci_core_instance.this : key => instance.private_ip
  }
}

