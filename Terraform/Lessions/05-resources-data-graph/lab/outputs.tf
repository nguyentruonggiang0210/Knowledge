output "service_addresses_by_key" {
  value = {
    for key, service in terraform_data.service : key => {
      id      = service.id
      release = service.output.release
    }
  }
}

