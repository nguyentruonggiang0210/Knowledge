resource "terraform_data" "legacy_name" {
  input = {
    name  = "state-lab"
    owner = "platform"
  }
}

