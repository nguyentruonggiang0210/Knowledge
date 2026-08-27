locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    managed_by  = "terraform"
    project     = var.project_name
    environment = var.environment
    purpose     = "learning"
  }
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.name_prefix}"
  location = var.location
  tags     = local.common_tags
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet-${local.name_prefix}"
  address_space       = [var.vnet_cidr]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

resource "azurerm_subnet" "web" {
  name                 = "snet-web"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.subnet_cidr]

}

resource "azurerm_network_security_group" "web" {
  name                = "nsg-${local.name_prefix}-web"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags

  security_rule {
    name                       = "allow-http-lab"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = var.allowed_http_cidr
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "web" {
  subnet_id                 = azurerm_subnet.web.id
  network_security_group_id = azurerm_network_security_group.web.id
}

resource "azurerm_public_ip" "web" {
  count = var.create_compute ? 1 : 0

  name                = "pip-${local.name_prefix}-web"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = local.common_tags
}

resource "azurerm_network_interface" "web" {
  count = var.create_compute ? 1 : 0

  name                = "nic-${local.name_prefix}-web"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags

  ip_configuration {
    name                          = "primary"
    subnet_id                     = azurerm_subnet.web.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.web[0].id
  }
}

resource "azurerm_linux_virtual_machine" "web" {
  count = var.create_compute ? 1 : 0

  name                            = "vm-${local.name_prefix}-web"
  computer_name                   = "tfweblab"
  location                        = azurerm_resource_group.main.location
  resource_group_name             = azurerm_resource_group.main.name
  size                            = var.vm_size
  admin_username                  = var.admin_username
  disable_password_authentication = true
  network_interface_ids           = [azurerm_network_interface.web[0].id]
  tags                            = local.common_tags

  dynamic "admin_ssh_key" {
    for_each = var.ssh_public_key == null ? [] : [var.ssh_public_key]

    content {
      username   = var.admin_username
      public_key = admin_ssh_key.value
    }
  }

  os_disk {
    name                 = "osdisk-${local.name_prefix}-web"
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = 30
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  custom_data = base64encode(<<-CLOUD_INIT
    #cloud-config
    package_update: true
    packages:
      - nginx
    write_files:
      - path: /var/www/html/index.html
        permissions: '0644'
        content: |
          <h1>Terraform Azure lab</h1>
    runcmd:
      - [systemctl, enable, --now, nginx]
  CLOUD_INIT
  )

  lifecycle {
    precondition {
      condition = !var.create_compute || (
        var.ssh_public_key != null &&
        can(regex("^ssh-(rsa|ed25519|ecdsa-sha2-nistp)", trimspace(var.ssh_public_key)))
      )
      error_message = "Khi create_compute=true, ssh_public_key phải là OpenSSH public key hợp lệ; tuyệt đối không truyền private key."
    }
  }
}
