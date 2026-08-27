locals {
  normalized_name = lower("${var.network.name}-${var.network.environment}")
  exposure        = var.network.public ? "public" : "private"
}

resource "terraform_data" "network_contract" {
  input = {
    name     = local.normalized_name
    cidr     = var.network.cidr
    exposure = local.exposure
  }
}

