variable "workloads" {
  type = map(object({
    role          = string
    public        = bool
    ingress_cidrs = set(string)
    encrypted     = bool
    owner         = string
  }))

  validation {
    condition = alltrue([
      for workload in values(var.workloads) :
      workload.role == "edge" || !workload.public
    ])
    error_message = "Chỉ workload role=edge được đánh dấu public."
  }

  validation {
    condition = alltrue([
      for workload in values(var.workloads) :
      workload.role == "edge" || !contains(workload.ingress_cidrs, "0.0.0.0/0")
    ])
    error_message = "Chỉ edge role được ingress từ 0.0.0.0/0."
  }
}

