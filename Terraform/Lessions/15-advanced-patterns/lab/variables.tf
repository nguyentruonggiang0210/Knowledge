variable "applications" {
  type = map(object({
    enabled = bool
    port    = number
  }))
  default = {
    api = {
      enabled = true
      port    = 8080
    }
    worker = {
      enabled = true
      port    = 9090
    }
  }
}

variable "regions" {
  type = map(object({
    enabled = bool
    cidr    = string
  }))
  default = {
    primary = {
      enabled = true
      cidr    = "10.50.0.0/16"
    }
    dr = {
      enabled = false
      cidr    = "10.60.0.0/16"
    }
  }
}

