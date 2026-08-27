provider "azurerm" {
  subscription_id = var.subscription_id

  # AzureRM v5 mặc định không auto-register Resource Provider.
  # Chỉ đăng ký namespace lab cần dùng; đặt register_resource_providers=false
  # nếu platform team đã đăng ký và execution identity không có quyền register.
  resource_providers_to_register = var.register_resource_providers ? concat(
    ["Microsoft.Network"],
    var.create_compute ? ["Microsoft.Compute"] : []
  ) : []

  features {}
}
