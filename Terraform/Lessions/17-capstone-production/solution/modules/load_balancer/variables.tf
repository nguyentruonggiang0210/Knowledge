variable "compartment_id" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "nsg_id" {
  type = string
}

variable "backend_ips" {
  description = "Stable backend key to private IP map."
  type        = map(string)
}

variable "app_port" {
  type    = number
  default = 8080
}

variable "minimum_bandwidth_in_mbps" {
  type    = number
  default = 10
}

variable "maximum_bandwidth_in_mbps" {
  type    = number
  default = 100
}

variable "tags" {
  type = map(string)
}

