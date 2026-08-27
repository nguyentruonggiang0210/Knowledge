output "network_contract" {
  value = {
    name     = local.normalized_name
    cidr     = var.network.cidr
    exposure = local.exposure
  }
}

