package terraform.security

import rego.v1

# Ví dụ tối giản cho Conftest trên terraform show -json.
# Production cần tests, exception model và xử lý unknown/after_unknown.
deny contains message if {
  some change in input.resource_changes
  change.type == "oci_core_network_security_group_security_rule"
  after := change.change.after
  after.direction == "INGRESS"
  after.source == "0.0.0.0/0"
  not approved_public_web_rule(after)
  message := sprintf("%s mở ingress Internet ngoài port web được duyệt", [change.address])
}

deny contains message if {
  some change in input.resource_changes
  startswith(change.type, "oci_")
  after := change.change.after
  tags := object.get(after, "freeform_tags", {})
  object.get(tags, "owner", "") == ""
  message := sprintf("%s thiếu freeform tag owner", [change.address])
}

approved_public_web_rule(rule) if {
  rule.protocol == "6"
  some tcp in rule.tcp_options
  some port_range in tcp.destination_port_range
  port_range.min == port_range.max
  port_range.min == 80
}

approved_public_web_rule(rule) if {
  rule.protocol == "6"
  some tcp in rule.tcp_options
  some port_range in tcp.destination_port_range
  port_range.min == port_range.max
  port_range.min == 443
}

