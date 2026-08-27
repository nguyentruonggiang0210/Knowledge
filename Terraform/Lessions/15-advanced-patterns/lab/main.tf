locals {
  deployment_pairs = setproduct(
    sort(keys(var.applications)),
    sort(keys(var.regions))
  )

  deployments = {
    for pair in local.deployment_pairs :
    "${pair[0]}@${pair[1]}" => {
      application = pair[0]
      region_key  = pair[1]
      port        = var.applications[pair[0]].port
      cidr        = var.regions[pair[1]].cidr
    }
    if var.applications[pair[0]].enabled && var.regions[pair[1]].enabled
  }
}

resource "terraform_data" "deployment" {
  for_each = local.deployments
  input    = each.value
}

