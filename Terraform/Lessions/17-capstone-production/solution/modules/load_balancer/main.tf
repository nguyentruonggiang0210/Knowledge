resource "oci_load_balancer_load_balancer" "this" {
  compartment_id             = var.compartment_id
  display_name               = "${var.name_prefix}-lb"
  shape                      = "flexible"
  subnet_ids                 = [var.subnet_id]
  is_private                 = false
  network_security_group_ids = [var.nsg_id]
  freeform_tags              = var.tags

  shape_details {
    minimum_bandwidth_in_mbps = var.minimum_bandwidth_in_mbps
    maximum_bandwidth_in_mbps = var.maximum_bandwidth_in_mbps
  }
}

resource "oci_load_balancer_backend_set" "app" {
  load_balancer_id = oci_load_balancer_load_balancer.this.id
  name             = "app"
  policy           = "LEAST_CONNECTIONS"

  health_checker {
    protocol          = "HTTP"
    port              = var.app_port
    url_path          = "/health"
    return_code       = 200
    retries           = 3
    timeout_in_millis = 3000
    interval_ms       = 10000
  }
}

resource "oci_load_balancer_backend" "app" {
  for_each = var.backend_ips

  load_balancer_id = oci_load_balancer_load_balancer.this.id
  backendset_name  = oci_load_balancer_backend_set.app.name
  ip_address       = each.value
  port             = var.app_port
  weight           = 1
  backup           = false
  drain            = false
  offline          = false
}

resource "oci_load_balancer_listener" "http" {
  load_balancer_id         = oci_load_balancer_load_balancer.this.id
  name                     = "http"
  default_backend_set_name = oci_load_balancer_backend_set.app.name
  port                     = 80
  protocol                 = "HTTP"
}

