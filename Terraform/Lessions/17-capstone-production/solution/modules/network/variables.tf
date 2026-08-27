variable "compartment_id" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "vcn_cidr" {
  type = string

  validation {
    condition     = can(cidrnetmask(var.vcn_cidr))
    error_message = "vcn_cidr phải là IPv4 CIDR hợp lệ."
  }
}

variable "enable_nat_gateway" {
  type    = bool
  default = false
}

variable "lb_ingress_cidrs" {
  type    = set(string)
  default = ["0.0.0.0/0"]
}

variable "app_port" {
  type    = number
  default = 8080
}

variable "data_port" {
  type    = number
  default = 1522
}

variable "tags" {
  type = map(string)
}

