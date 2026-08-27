variable "subscription_id" {
  description = "Azure Subscription ID. null để AzureRM lấy subscription hiện tại từ Azure CLI/environment."
  type        = string
  default     = null
  nullable    = true

  validation {
    condition     = var.subscription_id == null || can(regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", var.subscription_id))
    error_message = "subscription_id phải là UUID hợp lệ hoặc null."
  }
}

variable "location" {
  description = "Azure location triển khai lab."
  type        = string
  default     = "southeastasia"

  validation {
    condition     = can(regex("^[a-z0-9]+$", var.location))
    error_message = "location phải dùng canonical Azure location, ví dụ southeastasia."
  }
}

variable "project_name" {
  description = "Tên ngắn dùng làm prefix/tag; chữ thường, số và dấu gạch ngang."
  type        = string
  default     = "tf-oci-bridge"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$", var.project_name))
    error_message = "project_name phải dài 3-24 ký tự, chỉ gồm chữ thường, số, dấu gạch ngang và không bắt đầu/kết thúc bằng dấu gạch ngang."
  }
}

variable "environment" {
  description = "Tên môi trường."
  type        = string
  default     = "lab"

  validation {
    condition     = contains(["lab", "dev", "test", "staging", "prod"], var.environment)
    error_message = "environment phải là lab, dev, test, staging hoặc prod."
  }
}

variable "vnet_cidr" {
  description = "IPv4 CIDR cho VNet."
  type        = string
  default     = "10.30.0.0/16"

  validation {
    condition     = can(cidrnetmask(var.vnet_cidr))
    error_message = "vnet_cidr phải là IPv4 CIDR hợp lệ."
  }
}

variable "subnet_cidr" {
  description = "IPv4 CIDR cho subnet; phải nằm trong vnet_cidr."
  type        = string
  default     = "10.30.1.0/24"

  validation {
    condition     = can(cidrnetmask(var.subnet_cidr))
    error_message = "subnet_cidr phải là IPv4 CIDR hợp lệ."
  }
}

variable "register_resource_providers" {
  description = "Cho AzureRM đăng ký Microsoft.Network/Compute cần cho lab. Đặt false nếu platform team đã đăng ký."
  type        = bool
  default     = true
}

variable "create_compute" {
  description = "Bật để tạo VM, managed disk và public IP có tính phí. Mặc định false cho network-only."
  type        = bool
  default     = false
}

variable "vm_size" {
  description = "Azure VM size khi create_compute=true; kiểm tra availability và giá tại location đã chọn."
  type        = string
  default     = "Standard_B1s"
}

variable "admin_username" {
  description = "Tên admin Linux khi tạo VM."
  type        = string
  default     = "azureadmin"

  validation {
    condition     = can(regex("^[a-z_][a-z0-9_-]{0,30}$", var.admin_username))
    error_message = "admin_username phải là tên Linux hợp lệ, tối đa 31 ký tự."
  }
}

variable "ssh_public_key" {
  description = "OpenSSH public key khi create_compute=true. Đây là public key, không truyền private key."
  type        = string
  default     = null
  nullable    = true
}

variable "allowed_http_cidr" {
  description = "CIDR được phép truy cập HTTP port 80. Lab mặc định public; production phải giới hạn/đặt sau App Gateway/Front Door/WAF."
  type        = string
  default     = "0.0.0.0/0"

  validation {
    condition     = can(cidrnetmask(var.allowed_http_cidr))
    error_message = "allowed_http_cidr phải là IPv4 CIDR hợp lệ."
  }
}
