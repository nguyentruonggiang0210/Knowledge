module "name" {
  for_each = var.components
  source   = "./modules/naming"

  application = each.key
  environment = var.environment
  owner       = each.value.owner
}

resource "terraform_data" "component" {
  for_each = module.name

  input = {
    name = each.value.name
    tags = each.value.tags
  }
}

