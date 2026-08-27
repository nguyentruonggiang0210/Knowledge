resource "terraform_data" "production_name" {
  input = {
    name  = "state-lab"
    owner = "platform"
  }
}

moved {
  from = terraform_data.legacy_name
  to   = terraform_data.production_name
}

