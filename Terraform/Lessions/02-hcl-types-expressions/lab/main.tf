locals {
  enabled_services = {
    for service in var.services : service.name => service
    if service.enabled
  }

  all_ports = toset(flatten([
    for service in values(local.enabled_services) : tolist(service.ports)
  ]))
}

resource "terraform_data" "service" {
  for_each = local.enabled_services

  input = {
    name        = each.key
    environment = var.environment
    ports       = sort(tolist(each.value.ports))
    owner       = each.value.metadata.owner
    tier        = each.value.metadata.tier
  }
}

