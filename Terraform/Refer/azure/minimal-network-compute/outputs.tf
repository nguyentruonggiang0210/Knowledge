output "execution_context" {
  description = "Context để đối chiếu trước khi apply."
  value = {
    subscription_id = data.azurerm_client_config.current.subscription_id
    tenant_id       = data.azurerm_client_config.current.tenant_id
    location        = var.location
    create_compute  = var.create_compute
  }
}

output "resource_group_name" {
  description = "Resource Group chứa toàn bộ lab."
  value       = azurerm_resource_group.main.name
}

output "vnet_id" {
  description = "ID của VNet."
  value       = azurerm_virtual_network.main.id
}

output "subnet_id" {
  description = "ID của web subnet."
  value       = azurerm_subnet.web.id
}

output "vm_id" {
  description = "VM ID hoặc null khi create_compute=false."
  value       = try(azurerm_linux_virtual_machine.web[0].id, null)
}

output "public_url" {
  description = "HTTP URL hoặc null khi create_compute=false. Chờ cloud-init hoàn tất trước khi truy cập."
  value       = try("http://${azurerm_public_ip.web[0].ip_address}", null)
}
