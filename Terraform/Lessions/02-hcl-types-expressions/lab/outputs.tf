output "services_by_key" {
  value = {
    for key, service in terraform_data.service : key => service.output
  }
}

output "all_ports" {
  value = sort(tolist(local.all_ports))
}

