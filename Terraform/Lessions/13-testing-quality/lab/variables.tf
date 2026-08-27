variable "network" {
  type = object({
    name        = string
    environment = string
    cidr        = string
    public      = bool
  })

  validation {
    condition     = can(cidrnetmask(var.network.cidr))
    error_message = "network.cidr phải hợp lệ."
  }

  validation {
    condition     = var.network.environment != "prod" || !var.network.public
    error_message = "Production network trong module lab phải private."
  }
}

