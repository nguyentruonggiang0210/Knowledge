variable "application" {
  description = "Tên application/component."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]+$", var.application))
    error_message = "application phải là lowercase kebab-case."
  }
}

variable "environment" {
  description = "Môi trường triển khai."
  type        = string
}

variable "owner" {
  description = "Đội sở hữu."
  type        = string
}

