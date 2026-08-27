resource "terraform_data" "network" {
  input = {
    cidr = "10.20.0.0/16"
  }
}

resource "terraform_data" "release" {
  triggers_replace = var.release
  input            = var.release
}

resource "terraform_data" "service" {
  for_each = var.services

  input = {
    name       = each.key
    port       = each.value.port
    replicas   = each.value.replicas
    network_id = terraform_data.network.id
    release    = var.release
  }

  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [terraform_data.release]

    precondition {
      condition     = each.value.port >= 1 && each.value.port <= 65535
      error_message = "Port phải nằm trong khoảng 1..65535."
    }
  }
}

check "has_service_capacity" {
  assert {
    condition     = sum([for service in var.services : service.replicas]) >= 2
    error_message = "Tổng số replica phải >= 2."
  }
}

