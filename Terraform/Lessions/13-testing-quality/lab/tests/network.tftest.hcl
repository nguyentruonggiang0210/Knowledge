run "valid_private_production_network" {
  command = plan

  variables {
    network = {
      name        = "Payments"
      environment = "prod"
      cidr        = "10.40.0.0/16"
      public      = false
    }
  }

  assert {
    condition     = output.network_contract.name == "payments-prod"
    error_message = "Tên chưa được chuẩn hóa."
  }

  assert {
    condition     = output.network_contract.exposure == "private"
    error_message = "Production phải private."
  }
}

run "reject_public_production_network" {
  command = plan

  variables {
    network = {
      name        = "payments"
      environment = "prod"
      cidr        = "10.40.0.0/16"
      public      = true
    }
  }

  expect_failures = [var.network]
}

run "reject_invalid_cidr" {
  command = plan

  variables {
    network = {
      name        = "payments"
      environment = "dev"
      cidr        = "not-a-cidr"
      public      = false
    }
  }

  expect_failures = [var.network]
}

