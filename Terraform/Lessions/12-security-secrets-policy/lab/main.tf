resource "terraform_data" "guarded_workload" {
  for_each = var.workloads
  input    = each.value

  lifecycle {
    precondition {
      condition     = each.value.encrypted
      error_message = "Mọi workload phải bật encryption."
    }

    precondition {
      condition     = trimspace(each.value.owner) != ""
      error_message = "Mọi workload phải có owner."
    }
  }
}

