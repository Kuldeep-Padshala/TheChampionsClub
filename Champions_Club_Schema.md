# Champions Club Database Schema

This document outlines the tables, fields, data types, primary keys, and foreign keys for the Champions Club database.

## Table: `roles`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | smallint | Yes |  |
| code | text |  |  |
| name | text |  |  |
| description | text |  |  |

## Table: `permissions`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| code | text |  |  |
| module | text |  |  |
| description | text |  |  |# Champions Club Database Schema

This document outlines the tables, fields, data types, primary keys, and foreign keys for the Champions Club database.

## Table: `roles`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | smallint | Yes |  |
| code | text |  |  |
| name | text |  |  |
| description | text |  |  |

## Table: `permissions`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| code | text |  |  |
| module | text |  |  |
| description | text |  |  |

## Table: `role_permissions`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| role_id | smallint |  | roles.id |
| permission_id | bigint |  | permissions.id |

## Table: `users`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| email | text |  |  |
| phone | text |  |  |
| password_hash | text |  |  |
| status | text |  |  |
| must_change_password | boolean |  |  |
| failed_login_count | smallint |  |  |
| locked_until | timestamptz |  |  |
| last_login_at | timestamptz |  |  |
| email_verified_at | timestamptz |  |  |
| phone_verified_at | timestamptz |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `user_roles`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| user_id | bigint |  | users.id |
| role_id | smallint |  | roles.id |
| assigned_by | bigint |  | users.id |
| assigned_at | timestamptz |  |  |

## Table: `club_profile`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | smallint | Yes |  |
| name | text |  |  |
| tagline | text |  |  |
| description | text |  |  |
| address_line1 | text |  |  |
| address_line2 | text |  |  |
| city | text |  |  |
| state | text |  |  |
| postal_code | text |  |  |
| country | text |  |  |
| latitude | numeric(9,6) |  |  |
| longitude | numeric(9,6) |  |  |
| phone | text |  |  |
| email | text |  |  |
| website_url | text |  |  |
| logo_url | text |  |  |
| tax_id | text |  |  |
| currency_code | char(3) |  |  |
| timezone | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `club_settings`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| key | text | Yes |  |
| value | text |  |  |
| description | text |  |  |
| updated_by | bigint |  | users.id |
| updated_at | timestamptz |  |  |

## Table: `employees`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_code | text |  |  |
| user_id | bigint |  | users.id |
| full_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| date_of_birth | date |  |  |
| address | text |  |  |
| emergency_contact_name | text |  |  |
| emergency_contact_phone | text |  |  |
| department | text |  |  |
| job_title | text |  |  |
| employment_type | text |  |  |
| hire_date | date |  |  |
| termination_date | date |  |  |
| status | text |  |  |
| reports_to_employee_id | bigint |  | employees.id |
| pay_type | text |  |  |
| base_salary | numeric(12,2) |  |  |
| hourly_rate | numeric(10,2) |  |  |
| tax_id | text |  |  |
| bank_account_holder | text |  |  |
| bank_name | text |  |  |
| bank_account_number | text |  |  |
| bank_ifsc | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `shift_templates`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| department | text |  |  |
| start_time | time |  |  |
| end_time | time |  |  |
| is_active | boolean |  |  |

## Table: `shifts`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_id | bigint |  | employees.id |
| department | text |  |  |
| template_id | bigint |  | shift_templates.id |
| starts_at | timestamptz |  |  |
| ends_at | timestamptz |  |  |
| status | text |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `attendance_records`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_id | bigint |  | employees.id |
| shift_id | bigint |  | shifts.id |
| clock_in | timestamptz |  |  |
| clock_out | timestamptz |  |  |
| method | text |  |  |
| notes | text |  |  |
| recorded_by | bigint |  | users.id |

## Table: `leave_types`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| is_paid | boolean |  |  |
| annual_quota_days | numeric(4,1) |  |  |
| is_active | boolean |  |  |

## Table: `leave_requests`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_id | bigint |  | employees.id |
| leave_type_id | bigint |  | leave_types.id |
| start_date | date |  |  |
| end_date | date |  |  |
| days_requested | numeric(4,1) |  |  |
| reason | text |  |  |
| status | text |  |  |
| requested_at | timestamptz |  |  |
| decided_by | bigint |  | users.id |
| decided_at | timestamptz |  |  |
| decision_note | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `payroll_runs`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| period_month | date |  |  |
| status | text |  |  |
| created_by | bigint |  | users.id |
| approved_by | bigint |  | users.id |
| approved_at | timestamptz |  |  |
| paid_at | timestamptz |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |

## Table: `payroll_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| payroll_run_id | bigint |  | payroll_runs.id |
| employee_id | bigint |  | employees.id |
| days_worked | numeric(5,1) |  |  |
| hours_worked | numeric(7,2) |  |  |
| unpaid_leave_days | numeric(4,1) |  |  |
| base_pay | numeric(12,2) |  |  |
| overtime_pay | numeric(12,2) |  |  |
| allowances | numeric(12,2) |  |  |
| gross_pay | numeric(12,2) |  |  |
| unpaid_leave_deduction | numeric(12,2) |  |  |
| tax_deducted | numeric(12,2) |  |  |
| other_deductions | numeric(12,2) |  |  |
| net_pay | numeric(12,2) |  |  |
| payment_status | text |  |  |
| paid_at | timestamptz |  |  |
| payment_method | text |  |  |
| payment_reference | text |  |  |

## Table: `guardians`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| relationship | text |  |  |
| created_at | timestamptz |  |  |

## Table: `membership_plans`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| code | text |  |  |
| name | text |  |  |
| description | text |  |  |
| fee | numeric(10,2) |  |  |
| duration_months | smallint |  |  |
| joining_fee | numeric(10,2) |  |  |
| min_age | smallint |  |  |
| max_age | smallint |  |  |
| shop_discount_pct | numeric(5,2) |  |  |
| bar_discount_pct | numeric(5,2) |  |  |
| can_join_social_play | boolean |  |  |
| is_active | boolean |  |  |
| sort_order | smallint |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `plan_benefits`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| plan_id | bigint |  | membership_plans.id |
| description | text |  |  |
| sort_order | smallint |  |  |

## Table: `members`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_code | text |  |  |
| qr_token | text |  |  |
| user_id | bigint |  | users.id |
| full_name | text |  |  |
| date_of_birth | date |  |  |
| phone | text |  |  |
| email | text |  |  |
| address_line1 | text |  |  |
| address_line2 | text |  |  |
| city | text |  |  |
| postal_code | text |  |  |
| photo_url | text |  |  |
| emergency_contact_name | text |  |  |
| emergency_contact_phone | text |  |  |
| guardian_id | bigint |  | guardians.id |
| status | text |  |  |
| joined_on | date |  |  |
| registered_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `memberships`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_id | bigint |  | members.id |
| plan_id | bigint |  | membership_plans.id |
| start_date | date |  |  |
| end_date | date |  |  |
| status | text |  |  |
| started_as | text |  |  |
| previous_membership_id | bigint |  | memberships.id |
| auto_renew | boolean |  |  |
| fee_charged | numeric(10,2) |  |  |
| joining_fee_charged | numeric(10,2) |  |  |
| cancelled_at | timestamptz |  |  |
| cancelled_by | bigint |  | users.id |
| cancellation_reason | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `guests`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| source | text |  |  |
| converted_member_id | bigint |  | members.id |
| notes | text |  |  |
| created_at | timestamptz |  |  |

## Table: `business_clients`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| company_name | text |  |  |
| contact_person | text |  |  |
| email | text |  |  |
| phone | text |  |  |
| billing_address1 | text |  |  |
| billing_address2 | text |  |  |
| city | text |  |  |
| state | text |  |  |
| postal_code | text |  |  |
| tax_id | text |  |  |
| payment_terms_days | smallint |  |  |
| status | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `member_notes`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_id | bigint |  | members.id |
| note | text |  |  |
| is_pinned | boolean |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `sports`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| is_active | boolean |  |  |

## Table: `courts`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| sport_id | bigint |  | sports.id |
| surface | text |  |  |
| is_indoor | boolean |  |  |
| social_play_capacity | smallint |  |  |
| status | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `court_operating_hours`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| court_id | bigint |  | courts.id |
| day_of_week | smallint |  |  |
| open_time | time |  |  |
| close_time | time |  |  |

## Table: `court_rates`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| sport_id | bigint |  | sports.id |
| plan_id | bigint |  | membership_plans.id |
| applies_to | text |  |  |
| days_of_week | smallint[] |  |  |
| start_time | time |  |  |
| end_time | time |  |  |
| price | numeric(10,2) |  |  |
| valid_from | date |  |  |
| valid_to | date |  |  |
| is_active | boolean |  |  |

## Table: `court_reservations`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| court_id | bigint |  | courts.id |
| starts_at | timestamptz |  |  |
| ends_at | timestamptz |  |  |
| reservation_type | text |  |  |
| status | text |  |  |
| social_title | text |  |  |
| social_capacity | smallint |  |  |
| block_reason | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `bookings`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| booking_ref | text |  |  |
| reservation_id | bigint |  |  |
| reservation_type | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| membership_id | bigint |  | memberships.id |
| booked_via | text |  |  |
| booked_by | bigint |  | users.id |
| is_trial | boolean |  |  |
| rate_id | bigint |  | court_rates.id |
| price_basis | text |  |  |
| amount_charged | numeric(10,2) |  |  |
| status | text |  |  |
| checked_in_at | timestamptz |  |  |
| cancelled_at | timestamptz |  |  |
| cancelled_by | bigint |  | users.id |
| cancellation_reason | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `check_ins`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_id | bigint |  | members.id |
| booking_id | bigint |  | bookings.id |
| checked_in_at | timestamptz |  |  |
| method | text |  |  |
| recorded_by | bigint |  | users.id |
| notes | text |  |  |

## Table: `tax_rates`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| rate_pct | numeric(5,2) |  |  |
| is_active | boolean |  |  |

## Table: `product_categories`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| parent_id | bigint |  | product_categories.id |
| sort_order | smallint |  |  |
| is_active | boolean |  |  |

## Table: `products`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| category_id | bigint |  | product_categories.id |
| name | text |  |  |
| brand | text |  |  |
| description | text |  |  |
| base_price | numeric(12,2) |  |  |
| cost_price | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| image_url | text |  |  |
| is_listed_online | boolean |  |  |
| is_active | boolean |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `product_variants`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| product_id | bigint |  | products.id |
| sku | text |  |  |
| barcode | text |  |  |
| size | text |  |  |
| color | text |  |  |
| price_override | numeric(12,2) |  |  |
| stock_on_hand | integer |  |  |
| stock_reserved | integer |  |  |
| reorder_level | integer |  |  |
| is_active | boolean |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `suppliers`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| contact_person | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| address | text |  |  |
| tax_id | text |  |  |
| payment_terms_days | smallint |  |  |
| is_active | boolean |  |  |
| created_at | timestamptz |  |  |

## Table: `purchase_orders`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| po_number | text |  |  |
| supplier_id | bigint |  | suppliers.id |
| status | text |  |  |
| ordered_at | timestamptz |  |  |
| expected_on | date |  |  |
| received_at | timestamptz |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `purchase_order_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| purchase_order_id | bigint |  | purchase_orders.id |
| variant_id | bigint |  | product_variants.id |
| quantity_ordered | integer |  |  |
| quantity_received | integer |  |  |
| unit_cost | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |

## Table: `stock_movements`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| variant_id | bigint |  | product_variants.id |
| quantity_change | integer |  |  |
| reason | text |  |  |
| reference_type | text |  |  |
| reference_id | bigint |  |  |
| balance_after | integer |  |  |
| notes | text |  |  |
| performed_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `shop_orders`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_no | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| channel | text |  |  |
| fulfillment_type | text |  |  |
| status | text |  |  |
| taken_by | bigint |  | users.id |
| member_discount_pct | numeric(5,2) |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| delivery_fee | numeric(10,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| delivery_address_line1 | text |  |  |
| delivery_address_line2 | text |  |  |
| delivery_city | text |  |  |
| delivery_postal_code | text |  |  |
| delivery_phone | text |  |  |
| delivery_notes | text |  |  |
| assigned_delivery_to | bigint |  | employees.id |
| placed_at | timestamptz |  |  |
| ready_at | timestamptz |  |  |
| completed_at | timestamptz |  |  |
| cancelled_at | timestamptz |  |  |
| cancellation_reason | text |  |  |
| notes | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `shop_order_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_id | bigint |  | shop_orders.id |
| variant_id | bigint |  | product_variants.id |
| product_name | text |  |  |
| quantity | integer |  |  |
| unit_price | numeric(12,2) |  |  |
| discount_amount | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |

## Table: `bar_menu_categories`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| sort_order | smallint |  |  |
| is_active | boolean |  |  |

## Table: `bar_menu_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| category_id | bigint |  | bar_menu_categories.id |
| name | text |  |  |
| description | text |  |  |
| price | numeric(10,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| station | text |  |  |
| is_available | boolean |  |  |
| is_active | boolean |  |  |
| image_url | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `dining_tables`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| table_number | text |  |  |
| seats | smallint |  |  |
| zone | text |  |  |
| status | text |  |  |

## Table: `bar_tabs`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| tab_no | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| guest_name | text |  |  |
| table_id | bigint |  | dining_tables.id |
| status | text |  |  |
| opened_by | bigint |  | users.id |
| opened_at | timestamptz |  |  |
| settled_at | timestamptz |  |  |
| closed_by | bigint |  | users.id |

## Table: `bar_orders`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_no | text |  |  |
| tab_id | bigint |  | bar_tabs.id |
| table_id | bigint |  | dining_tables.id |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| taken_by | bigint |  | users.id |
| status | text |  |  |
| member_discount_pct | numeric(5,2) |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| notes | text |  |  |
| placed_at | timestamptz |  |  |
| served_at | timestamptz |  |  |
| cancelled_at | timestamptz |  |  |
| cancellation_reason | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `bar_order_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_id | bigint |  | bar_orders.id |
| menu_item_id | bigint |  | bar_menu_items.id |
| item_name | text |  |  |
| quantity | integer |  |  |
| unit_price | numeric(10,2) |  |  |
| discount_amount | numeric(10,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(10,2) |  |  |
| line_total | numeric(10,2) |  |  |
| station | text |  |  |
| kitchen_status | text |  |  |
| special_instructions | text |  |  |
| ready_at | timestamptz |  |  |

## Table: `enquiries`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| company_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| source | text |  |  |
| enquiry_type | text |  |  |
| interested_plan_id | bigint |  | membership_plans.id |
| interested_sport_id | bigint |  | sports.id |
| message | text |  |  |
| status | text |  |  |
| assigned_to | bigint |  | users.id |
| next_follow_up_at | timestamptz |  |  |
| trial_booking_id | bigint |  | bookings.id |
| converted_member_id | bigint |  | members.id |
| business_client_id | bigint |  | business_clients.id |
| lost_reason | text |  |  |
| closed_at | timestamptz |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `enquiry_activities`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| enquiry_id | bigint |  | enquiries.id |
| activity_type | text |  |  |
| summary | text |  |  |
| performed_by | bigint |  | users.id |
| occurred_at | timestamptz |  |  |

## Table: `quotes`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| quote_no | text |  |  |
| enquiry_id | bigint |  | enquiries.id |
| plan_id | bigint |  | membership_plans.id |
| business_client_id | bigint |  | business_clients.id |
| status | text |  |  |
| valid_until | date |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| sent_at | timestamptz |  |  |
| sent_via | text |  |  |
| accepted_at | timestamptz |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `quote_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| quote_id | bigint |  | quotes.id |
| description | text |  |  |
| quantity | numeric(10,2) |  |  |
| unit_price | numeric(12,2) |  |  |
| discount_amount | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |

## Table: `invoices`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| invoice_no | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| business_client_id | bigint |  | business_clients.id |
| bill_to_name | text |  |  |
| quote_id | bigint |  | quotes.id |
| status | text |  |  |
| issue_date | date |  |  |
| due_date | date |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| amount_paid | numeric(12,2) |  |  |
| balance_due | numeric(12,2) |  |  |
| notes | text |  |  |
| issued_by | bigint |  | users.id |
| voided_at | timestamptz |  |  |
| voided_by | bigint |  | users.id |
| void_reason | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `invoice_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| invoice_id | bigint |  | invoices.id |
| source | text |  |  |
| description | text |  |  |
| quantity | numeric(10,2) |  |  |
| unit_price | numeric(12,2) |  |  |
| discount_amount | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |
| membership_id | bigint |  | memberships.id |
| booking_id | bigint |  | bookings.id |
| shop_order_id | bigint |  | shop_orders.id |
| bar_order_id | bigint |  | bar_orders.id |

## Table: `payments`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| receipt_no | text |  |  |
| invoice_id | bigint |  | invoices.id |
| amount | numeric(12,2) |  |  |
| method | text |  |  |
| status | text |  |  |
| gateway_name | text |  |  |
| transaction_ref | text |  |  |
| card_last4 | char(4) |  |  |
| received_by | bigint |  | users.id |
| paid_at | timestamptz |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |

## Table: `refunds`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| payment_id | bigint |  | payments.id |
| amount | numeric(12,2) |  |  |
| method | text |  |  |
| reason | text |  |  |
| refunded_by | bigint |  | users.id |
| refunded_at | timestamptz |  |  |

## Table: `daily_closings`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| business_date | date |  |  |
| department | text |  |  |
| total_sales | numeric(12,2) |  |  |
| cash_total | numeric(12,2) |  |  |
| card_total | numeric(12,2) |  |  |
| upi_total | numeric(12,2) |  |  |
| online_total | numeric(12,2) |  |  |
| other_total | numeric(12,2) |  |  |
| opening_cash | numeric(12,2) |  |  |
| expected_cash | numeric(12,2) |  |  |
| counted_cash | numeric(12,2) |  |  |
| cash_variance | numeric(12,2) |  |  |
| closed_by | bigint |  | users.id |
| closed_at | timestamptz |  |  |
| notes | text |  |  |

## Table: `expense_categories`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| is_active | boolean |  |  |

## Table: `expenses`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| category_id | bigint |  | expense_categories.id |
| supplier_id | bigint |  | suppliers.id |
| purchase_order_id | bigint |  | purchase_orders.id |
| description | text |  |  |
| amount | numeric(12,2) |  |  |
| tax_amount | numeric(12,2) |  |  |
| expense_date | date |  |  |
| due_date | date |  |  |
| status | text |  |  |
| paid_at | timestamptz |  |  |
| payment_method | text |  |  |
| reference_no | text |  |  |
| receipt_url | text |  |  |
| recorded_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `tax_returns`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| tax_type | text |  |  |
| period_start | date |  |  |
| period_end | date |  |  |
| tax_collected | numeric(12,2) |  |  |
| tax_credit | numeric(12,2) |  |  |
| net_payable | numeric(12,2) |  |  |
| status | text |  |  |
| due_date | date |  |  |
| filed_at | timestamptz |  |  |
| filed_by | bigint |  | users.id |
| paid_at | timestamptz |  |  |
| reference_no | text |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `report_shares`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| report_type | text |  |  |
| period_start | date |  |  |
| period_end | date |  |  |
| snapshot | jsonb |  |  |
| share_token | text |  |  |
| recipient_name | text |  |  |
| recipient_email | text |  |  |
| expires_at | timestamptz |  |  |
| revoked_at | timestamptz |  |  |
| view_count | integer |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `notifications`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| recipient_user_id | bigint |  | users.id |
| recipient_contact | text |  |  |
| type | text |  |  |
| channel | text |  |  |
| title | text |  |  |
| body | text |  |  |
| entity_type | text |  |  |
| entity_id | bigint |  |  |
| dedupe_key | text |  |  |
| status | text |  |  |
| is_read | boolean |  |  |
| read_at | timestamptz |  |  |
| scheduled_for | timestamptz |  |  |
| sent_at | timestamptz |  |  |
| created_at | timestamptz |  |  |

## Table: `audit_logs`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| user_id | bigint |  | users.id |
| action | text |  |  |
| entity_type | text |  |  |
| entity_id | bigint |  |  |
| old_values | jsonb |  |  |
| new_values | jsonb |  |  |
| ip_address | inet |  |  |
| user_agent | text |  |  |
| created_at | timestamptz |  |  |
# Champions Club Database Schema

This document outlines the tables, fields, data types, primary keys, and foreign keys for the Champions Club database.

## Table: `roles`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | smallint | Yes |  |
| code | text |  |  |
| name | text |  |  |
| description | text |  |  |

## Table: `permissions`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| code | text |  |  |
| module | text |  |  |
| description | text |  |  |

## Table: `role_permissions`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| role_id | smallint |  | roles.id |
| permission_id | bigint |  | permissions.id |

## Table: `users`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| email | text |  |  |
| phone | text |  |  |
| password_hash | text |  |  |
| status | text |  |  |
| must_change_password | boolean |  |  |
| failed_login_count | smallint |  |  |
| locked_until | timestamptz |  |  |
| last_login_at | timestamptz |  |  |
| email_verified_at | timestamptz |  |  |
| phone_verified_at | timestamptz |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `user_roles`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| user_id | bigint |  | users.id |
| role_id | smallint |  | roles.id |
| assigned_by | bigint |  | users.id |
| assigned_at | timestamptz |  |  |

## Table: `club_profile`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | smallint | Yes |  |
| name | text |  |  |
| tagline | text |  |  |
| description | text |  |  |
| address_line1 | text |  |  |
| address_line2 | text |  |  |
| city | text |  |  |
| state | text |  |  |
| postal_code | text |  |  |
| country | text |  |  |
| latitude | numeric(9,6) |  |  |
| longitude | numeric(9,6) |  |  |
| phone | text |  |  |
| email | text |  |  |
| website_url | text |  |  |
| logo_url | text |  |  |
| tax_id | text |  |  |
| currency_code | char(3) |  |  |
| timezone | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `club_settings`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| key | text | Yes |  |
| value | text |  |  |
| description | text |  |  |
| updated_by | bigint |  | users.id |
| updated_at | timestamptz |  |  |

## Table: `employees`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_code | text |  |  |
| user_id | bigint |  | users.id |
| full_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| date_of_birth | date |  |  |
| address | text |  |  |
| emergency_contact_name | text |  |  |
| emergency_contact_phone | text |  |  |
| department | text |  |  |
| job_title | text |  |  |
| employment_type | text |  |  |
| hire_date | date |  |  |
| termination_date | date |  |  |
| status | text |  |  |
| reports_to_employee_id | bigint |  | employees.id |
| pay_type | text |  |  |
| base_salary | numeric(12,2) |  |  |
| hourly_rate | numeric(10,2) |  |  |
| tax_id | text |  |  |
| bank_account_holder | text |  |  |
| bank_name | text |  |  |
| bank_account_number | text |  |  |
| bank_ifsc | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `shift_templates`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| department | text |  |  |
| start_time | time |  |  |
| end_time | time |  |  |
| is_active | boolean |  |  |

## Table: `shifts`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_id | bigint |  | employees.id |
| department | text |  |  |
| template_id | bigint |  | shift_templates.id |
| starts_at | timestamptz |  |  |
| ends_at | timestamptz |  |  |
| status | text |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `attendance_records`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_id | bigint |  | employees.id |
| shift_id | bigint |  | shifts.id |
| clock_in | timestamptz |  |  |
| clock_out | timestamptz |  |  |
| method | text |  |  |
| notes | text |  |  |
| recorded_by | bigint |  | users.id |

## Table: `leave_types`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| is_paid | boolean |  |  |
| annual_quota_days | numeric(4,1) |  |  |
| is_active | boolean |  |  |

## Table: `leave_requests`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_id | bigint |  | employees.id |
| leave_type_id | bigint |  | leave_types.id |
| start_date | date |  |  |
| end_date | date |  |  |
| days_requested | numeric(4,1) |  |  |
| reason | text |  |  |
| status | text |  |  |
| requested_at | timestamptz |  |  |
| decided_by | bigint |  | users.id |
| decided_at | timestamptz |  |  |
| decision_note | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `payroll_runs`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| period_month | date |  |  |
| status | text |  |  |
| created_by | bigint |  | users.id |
| approved_by | bigint |  | users.id |
| approved_at | timestamptz |  |  |
| paid_at | timestamptz |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |

## Table: `payroll_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| payroll_run_id | bigint |  | payroll_runs.id |
| employee_id | bigint |  | employees.id |
| days_worked | numeric(5,1) |  |  |
| hours_worked | numeric(7,2) |  |  |
| unpaid_leave_days | numeric(4,1) |  |  |
| base_pay | numeric(12,2) |  |  |
| overtime_pay | numeric(12,2) |  |  |
| allowances | numeric(12,2) |  |  |
| gross_pay | numeric(12,2) |  |  |
| unpaid_leave_deduction | numeric(12,2) |  |  |
| tax_deducted | numeric(12,2) |  |  |
| other_deductions | numeric(12,2) |  |  |
| net_pay | numeric(12,2) |  |  |
| payment_status | text |  |  |
| paid_at | timestamptz |  |  |
| payment_method | text |  |  |
| payment_reference | text |  |  |

## Table: `guardians`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| relationship | text |  |  |
| created_at | timestamptz |  |  |

## Table: `membership_plans`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| code | text |  |  |
| name | text |  |  |
| description | text |  |  |
| fee | numeric(10,2) |  |  |
| duration_months | smallint |  |  |
| joining_fee | numeric(10,2) |  |  |
| min_age | smallint |  |  |
| max_age | smallint |  |  |
| shop_discount_pct | numeric(5,2) |  |  |
| bar_discount_pct | numeric(5,2) |  |  |
| can_join_social_play | boolean |  |  |
| is_active | boolean |  |  |
| sort_order | smallint |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `plan_benefits`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| plan_id | bigint |  | membership_plans.id |
| description | text |  |  |
| sort_order | smallint |  |  |

## Table: `members`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_code | text |  |  |
| qr_token | text |  |  |
| user_id | bigint |  | users.id |
| full_name | text |  |  |
| date_of_birth | date |  |  |
| phone | text |  |  |
| email | text |  |  |
| address_line1 | text |  |  |
| address_line2 | text |  |  |
| city | text |  |  |
| postal_code | text |  |  |
| photo_url | text |  |  |
| emergency_contact_name | text |  |  |
| emergency_contact_phone | text |  |  |
| guardian_id | bigint |  | guardians.id |
| status | text |  |  |
| joined_on | date |  |  |
| registered_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `memberships`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_id | bigint |  | members.id |
| plan_id | bigint |  | membership_plans.id |
| start_date | date |  |  |
| end_date | date |  |  |
| status | text |  |  |
| started_as | text |  |  |
| previous_membership_id | bigint |  | memberships.id |
| auto_renew | boolean |  |  |
| fee_charged | numeric(10,2) |  |  |
| joining_fee_charged | numeric(10,2) |  |  |
| cancelled_at | timestamptz |  |  |
| cancelled_by | bigint |  | users.id |
| cancellation_reason | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `guests`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| source | text |  |  |
| converted_member_id | bigint |  | members.id |
| notes | text |  |  |
| created_at | timestamptz |  |  |

## Table: `business_clients`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| company_name | text |  |  |
| contact_person | text |  |  |
| email | text |  |  |
| phone | text |  |  |
| billing_address1 | text |  |  |
| billing_address2 | text |  |  |
| city | text |  |  |
| state | text |  |  |
| postal_code | text |  |  |
| tax_id | text |  |  |
| payment_terms_days | smallint |  |  |
| status | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `member_notes`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_id | bigint |  | members.id |
| note | text |  |  |
| is_pinned | boolean |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `sports`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| is_active | boolean |  |  |

## Table: `courts`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| sport_id | bigint |  | sports.id |
| surface | text |  |  |
| is_indoor | boolean |  |  |
| social_play_capacity | smallint |  |  |
| status | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `court_operating_hours`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| court_id | bigint |  | courts.id |
| day_of_week | smallint |  |  |
| open_time | time |  |  |
| close_time | time |  |  |

## Table: `court_rates`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| sport_id | bigint |  | sports.id |
| plan_id | bigint |  | membership_plans.id |
| applies_to | text |  |  |
| days_of_week | smallint[] |  |  |
| start_time | time |  |  |
| end_time | time |  |  |
| price | numeric(10,2) |  |  |
| valid_from | date |  |  |
| valid_to | date |  |  |
| is_active | boolean |  |  |

## Table: `court_reservations`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| court_id | bigint |  | courts.id |
| starts_at | timestamptz |  |  |
| ends_at | timestamptz |  |  |
| reservation_type | text |  |  |
| status | text |  |  |
| social_title | text |  |  |
| social_capacity | smallint |  |  |
| block_reason | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `bookings`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| booking_ref | text |  |  |
| reservation_id | bigint |  |  |
| reservation_type | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| membership_id | bigint |  | memberships.id |
| booked_via | text |  |  |
| booked_by | bigint |  | users.id |
| is_trial | boolean |  |  |
| rate_id | bigint |  | court_rates.id |
| price_basis | text |  |  |
| amount_charged | numeric(10,2) |  |  |
| status | text |  |  |
| checked_in_at | timestamptz |  |  |
| cancelled_at | timestamptz |  |  |
| cancelled_by | bigint |  | users.id |
| cancellation_reason | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `check_ins`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_id | bigint |  | members.id |
| booking_id | bigint |  | bookings.id |
| checked_in_at | timestamptz |  |  |
| method | text |  |  |
| recorded_by | bigint |  | users.id |
| notes | text |  |  |

## Table: `tax_rates`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| rate_pct | numeric(5,2) |  |  |
| is_active | boolean |  |  |

## Table: `product_categories`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| parent_id | bigint |  | product_categories.id |
| sort_order | smallint |  |  |
| is_active | boolean |  |  |

## Table: `products`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| category_id | bigint |  | product_categories.id |
| name | text |  |  |
| brand | text |  |  |
| description | text |  |  |
| base_price | numeric(12,2) |  |  |
| cost_price | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| image_url | text |  |  |
| is_listed_online | boolean |  |  |
| is_active | boolean |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `product_variants`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| product_id | bigint |  | products.id |
| sku | text |  |  |
| barcode | text |  |  |
| size | text |  |  |
| color | text |  |  |
| price_override | numeric(12,2) |  |  |
| stock_on_hand | integer |  |  |
| stock_reserved | integer |  |  |
| reorder_level | integer |  |  |
| is_active | boolean |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `suppliers`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| contact_person | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| address | text |  |  |
| tax_id | text |  |  |
| payment_terms_days | smallint |  |  |
| is_active | boolean |  |  |
| created_at | timestamptz |  |  |

## Table: `purchase_orders`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| po_number | text |  |  |
| supplier_id | bigint |  | suppliers.id |
| status | text |  |  |
| ordered_at | timestamptz |  |  |
| expected_on | date |  |  |
| received_at | timestamptz |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `purchase_order_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| purchase_order_id | bigint |  | purchase_orders.id |
| variant_id | bigint |  | product_variants.id |
| quantity_ordered | integer |  |  |
| quantity_received | integer |  |  |
| unit_cost | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |

## Table: `stock_movements`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| variant_id | bigint |  | product_variants.id |
| quantity_change | integer |  |  |
| reason | text |  |  |
| reference_type | text |  |  |
| reference_id | bigint |  |  |
| balance_after | integer |  |  |
| notes | text |  |  |
| performed_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `shop_orders`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_no | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| channel | text |  |  |
| fulfillment_type | text |  |  |
| status | text |  |  |
| taken_by | bigint |  | users.id |
| member_discount_pct | numeric(5,2) |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| delivery_fee | numeric(10,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| delivery_address_line1 | text |  |  |
| delivery_address_line2 | text |  |  |
| delivery_city | text |  |  |
| delivery_postal_code | text |  |  |
| delivery_phone | text |  |  |
| delivery_notes | text |  |  |
| assigned_delivery_to | bigint |  | employees.id |
| placed_at | timestamptz |  |  |
| ready_at | timestamptz |  |  |
| completed_at | timestamptz |  |  |
| cancelled_at | timestamptz |  |  |
| cancellation_reason | text |  |  |
| notes | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `shop_order_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_id | bigint |  | shop_orders.id |
| variant_id | bigint |  | product_variants.id |
| product_name | text |  |  |
| quantity | integer |  |  |
| unit_price | numeric(12,2) |  |  |
| discount_amount | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |

## Table: `bar_menu_categories`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| sort_order | smallint |  |  |
| is_active | boolean |  |  |

## Table: `bar_menu_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| category_id | bigint |  | bar_menu_categories.id |
| name | text |  |  |
| description | text |  |  |
| price | numeric(10,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| station | text |  |  |
| is_available | boolean |  |  |
| is_active | boolean |  |  |
| image_url | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `dining_tables`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| table_number | text |  |  |
| seats | smallint |  |  |
| zone | text |  |  |
| status | text |  |  |

## Table: `bar_tabs`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| tab_no | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| guest_name | text |  |  |
| table_id | bigint |  | dining_tables.id |
| status | text |  |  |
| opened_by | bigint |  | users.id |
| opened_at | timestamptz |  |  |
| settled_at | timestamptz |  |  |
| closed_by | bigint |  | users.id |

## Table: `bar_orders`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_no | text |  |  |
| tab_id | bigint |  | bar_tabs.id |
| table_id | bigint |  | dining_tables.id |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| taken_by | bigint |  | users.id |
| status | text |  |  |
| member_discount_pct | numeric(5,2) |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| notes | text |  |  |
| placed_at | timestamptz |  |  |
| served_at | timestamptz |  |  |
| cancelled_at | timestamptz |  |  |
| cancellation_reason | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `bar_order_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_id | bigint |  | bar_orders.id |
| menu_item_id | bigint |  | bar_menu_items.id |
| item_name | text |  |  |
| quantity | integer |  |  |
| unit_price | numeric(10,2) |  |  |
| discount_amount | numeric(10,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(10,2) |  |  |
| line_total | numeric(10,2) |  |  |
| station | text |  |  |
| kitchen_status | text |  |  |
| special_instructions | text |  |  |
| ready_at | timestamptz |  |  |

## Table: `enquiries`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| company_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| source | text |  |  |
| enquiry_type | text |  |  |
| interested_plan_id | bigint |  | membership_plans.id |
| interested_sport_id | bigint |  | sports.id |
| message | text |  |  |
| status | text |  |  |
| assigned_to | bigint |  | users.id |
| next_follow_up_at | timestamptz |  |  |
| trial_booking_id | bigint |  | bookings.id |
| converted_member_id | bigint |  | members.id |
| business_client_id | bigint |  | business_clients.id |
| lost_reason | text |  |  |
| closed_at | timestamptz |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `enquiry_activities`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| enquiry_id | bigint |  | enquiries.id |
| activity_type | text |  |  |
| summary | text |  |  |
| performed_by | bigint |  | users.id |
| occurred_at | timestamptz |  |  |

## Table: `quotes`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| quote_no | text |  |  |
| enquiry_id | bigint |  | enquiries.id |
| plan_id | bigint |  | membership_plans.id |
| business_client_id | bigint |  | business_clients.id |
| status | text |  |  |
| valid_until | date |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| sent_at | timestamptz |  |  |
| sent_via | text |  |  |
| accepted_at | timestamptz |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `quote_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| quote_id | bigint |  | quotes.id |
| description | text |  |  |
| quantity | numeric(10,2) |  |  |
| unit_price | numeric(12,2) |  |  |
| discount_amount | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |

## Table: `invoices`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| invoice_no | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| business_client_id | bigint |  | business_clients.id |
| bill_to_name | text |  |  |
| quote_id | bigint |  | quotes.id |
| status | text |  |  |
| issue_date | date |  |  |
| due_date | date |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| amount_paid | numeric(12,2) |  |  |
| balance_due | numeric(12,2) |  |  |
| notes | text |  |  |
| issued_by | bigint |  | users.id |
| voided_at | timestamptz |  |  |
| voided_by | bigint |  | users.id |
| void_reason | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `invoice_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| invoice_id | bigint |  | invoices.id |
| source | text |  |  |
| description | text |  |  |
| quantity | numeric(10,2) |  |  |
| unit_price | numeric(12,2) |  |  |
| discount_amount | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |
| membership_id | bigint |  | memberships.id |
| booking_id | bigint |  | bookings.id |
| shop_order_id | bigint |  | shop_orders.id |
| bar_order_id | bigint |  | bar_orders.id |

## Table: `payments`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| receipt_no | text |  |  |
| invoice_id | bigint |  | invoices.id |
| amount | numeric(12,2) |  |  |
| method | text |  |  |
| status | text |  |  |
| gateway_name | text |  |  |
| transaction_ref | text |  |  |
| card_last4 | char(4) |  |  |
| received_by | bigint |  | users.id |
| paid_at | timestamptz |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |

## Table: `refunds`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| payment_id | bigint |  | payments.id |
| amount | numeric(12,2) |  |  |
| method | text |  |  |
| reason | text |  |  |
| refunded_by | bigint |  | users.id |
| refunded_at | timestamptz |  |  |

## Table: `daily_closings`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| business_date | date |  |  |
| department | text |  |  |
| total_sales | numeric(12,2) |  |  |
| cash_total | numeric(12,2) |  |  |
| card_total | numeric(12,2) |  |  |
| upi_total | numeric(12,2) |  |  |
| online_total | numeric(12,2) |  |  |
| other_total | numeric(12,2) |  |  |
| opening_cash | numeric(12,2) |  |  |
| expected_cash | numeric(12,2) |  |  |
| counted_cash | numeric(12,2) |  |  |
| cash_variance | numeric(12,2) |  |  |
| closed_by | bigint |  | users.id |
| closed_at | timestamptz |  |  |
| notes | text |  |  |

## Table: `expense_categories`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| is_active | boolean |  |  |

## Table: `expenses`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| category_id | bigint |  | expense_categories.id |
| supplier_id | bigint |  | suppliers.id |
| purchase_order_id | bigint |  | purchase_orders.id |
| description | text |  |  |
| amount | numeric(12,2) |  |  |
| tax_amount | numeric(12,2) |  |  |
| expense_date | date |  |  |
| due_date | date |  |  |
| status | text |  |  |
| paid_at | timestamptz |  |  |
| payment_method | text |  |  |
| reference_no | text |  |  |
| receipt_url | text |  |  |
| recorded_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `tax_returns`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| tax_type | text |  |  |
| period_start | date |  |  |
| period_end | date |  |  |
| tax_collected | numeric(12,2) |  |  |
| tax_credit | numeric(12,2) |  |  |
| net_payable | numeric(12,2) |  |  |
| status | text |  |  |
| due_date | date |  |  |
| filed_at | timestamptz |  |  |
| filed_by | bigint |  | users.id |
| paid_at | timestamptz |  |  |
| reference_no | text |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `report_shares`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| report_type | text |  |  |
| period_start | date |  |  |
| period_end | date |  |  |
| snapshot | jsonb |  |  |
| share_token | text |  |  |
| recipient_name | text |  |  |
| recipient_email | text |  |  |
| expires_at | timestamptz |  |  |
| revoked_at | timestamptz |  |  |
| view_count | integer |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `notifications`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| recipient_user_id | bigint |  | users.id |
| recipient_contact | text |  |  |
| type | text |  |  |
| channel | text |  |  |
| title | text |  |  |
| body | text |  |  |
| entity_type | text |  |  |
| entity_id | bigint |  |  |
| dedupe_key | text |  |  |
| status | text |  |  |
| is_read | boolean |  |  |
| read_at | timestamptz |  |  |
| scheduled_for | timestamptz |  |  |
| sent_at | timestamptz |  |  |
| created_at | timestamptz |  |  |

## Table: `audit_logs`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| user_id | bigint |  | users.id |
| action | text |  |  |
| entity_type | text |  |  |
| entity_id | bigint |  |  |
| old_values | jsonb |  |  |
| new_values | jsonb |  |  |
| ip_address | inet |  |  |
| user_agent | text |  |  |
| created_at | timestamptz |  |  |


## Table: `role_permissions`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| role_id | smallint |  | roles.id |
| permission_id | bigint |  | permissions.id |

## Table: `users`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| email | text |  |  |
| phone | text |  |  |
| password_hash | text |  |  |
| status | text |  |  |
| must_change_password | boolean |  |  |
| failed_login_count | smallint |  |  |
| locked_until | timestamptz |  |  |
| last_login_at | timestamptz |  |  |
| email_verified_at | timestamptz |  |  |
| phone_verified_at | timestamptz |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `user_roles`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| user_id | bigint |  | users.id |
| role_id | smallint |  | roles.id |
| assigned_by | bigint |  | users.id |
| assigned_at | timestamptz |  |  |

## Table: `club_profile`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | smallint | Yes |  |
| name | text |  |  |
| tagline | text |  |  |
| description | text |  |  |
| address_line1 | text |  |  |
| address_line2 | text |  |  |
| city | text |  |  |
| state | text |  |  |
| postal_code | text |  |  |
| country | text |  |  |
| latitude | numeric(9,6) |  |  |
| longitude | numeric(9,6) |  |  |
| phone | text |  |  |
| email | text |  |  |
| website_url | text |  |  |
| logo_url | text |  |  |
| tax_id | text |  |  |
| currency_code | char(3) |  |  |
| timezone | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `club_settings`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| key | text | Yes |  |
| value | text |  |  |
| description | text |  |  |
| updated_by | bigint |  | users.id |
| updated_at | timestamptz |  |  |

## Table: `employees`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_code | text |  |  |
| user_id | bigint |  | users.id |
| full_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| date_of_birth | date |  |  |
| address | text |  |  |
| emergency_contact_name | text |  |  |
| emergency_contact_phone | text |  |  |
| department | text |  |  |
| job_title | text |  |  |
| employment_type | text |  |  |
| hire_date | date |  |  |
| termination_date | date |  |  |
| status | text |  |  |
| reports_to_employee_id | bigint |  | employees.id |
| pay_type | text |  |  |
| base_salary | numeric(12,2) |  |  |
| hourly_rate | numeric(10,2) |  |  |
| tax_id | text |  |  |
| bank_account_holder | text |  |  |
| bank_name | text |  |  |
| bank_account_number | text |  |  |
| bank_ifsc | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `shift_templates`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| department | text |  |  |
| start_time | time |  |  |
| end_time | time |  |  |
| is_active | boolean |  |  |

## Table: `shifts`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_id | bigint |  | employees.id |
| department | text |  |  |
| template_id | bigint |  | shift_templates.id |
| starts_at | timestamptz |  |  |
| ends_at | timestamptz |  |  |
| status | text |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `attendance_records`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_id | bigint |  | employees.id |
| shift_id | bigint |  | shifts.id |
| clock_in | timestamptz |  |  |
| clock_out | timestamptz |  |  |
| method | text |  |  |
| notes | text |  |  |
| recorded_by | bigint |  | users.id |

## Table: `leave_types`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| is_paid | boolean |  |  |
| annual_quota_days | numeric(4,1) |  |  |
| is_active | boolean |  |  |

## Table: `leave_requests`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| employee_id | bigint |  | employees.id |
| leave_type_id | bigint |  | leave_types.id |
| start_date | date |  |  |
| end_date | date |  |  |
| days_requested | numeric(4,1) |  |  |
| reason | text |  |  |
| status | text |  |  |
| requested_at | timestamptz |  |  |
| decided_by | bigint |  | users.id |
| decided_at | timestamptz |  |  |
| decision_note | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `payroll_runs`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| period_month | date |  |  |
| status | text |  |  |
| created_by | bigint |  | users.id |
| approved_by | bigint |  | users.id |
| approved_at | timestamptz |  |  |
| paid_at | timestamptz |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |

## Table: `payroll_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| payroll_run_id | bigint |  | payroll_runs.id |
| employee_id | bigint |  | employees.id |
| days_worked | numeric(5,1) |  |  |
| hours_worked | numeric(7,2) |  |  |
| unpaid_leave_days | numeric(4,1) |  |  |
| base_pay | numeric(12,2) |  |  |
| overtime_pay | numeric(12,2) |  |  |
| allowances | numeric(12,2) |  |  |
| gross_pay | numeric(12,2) |  |  |
| unpaid_leave_deduction | numeric(12,2) |  |  |
| tax_deducted | numeric(12,2) |  |  |
| other_deductions | numeric(12,2) |  |  |
| net_pay | numeric(12,2) |  |  |
| payment_status | text |  |  |
| paid_at | timestamptz |  |  |
| payment_method | text |  |  |
| payment_reference | text |  |  |

## Table: `guardians`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| relationship | text |  |  |
| created_at | timestamptz |  |  |

## Table: `membership_plans`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| code | text |  |  |
| name | text |  |  |
| description | text |  |  |
| fee | numeric(10,2) |  |  |
| duration_months | smallint |  |  |
| joining_fee | numeric(10,2) |  |  |
| min_age | smallint |  |  |
| max_age | smallint |  |  |
| shop_discount_pct | numeric(5,2) |  |  |
| bar_discount_pct | numeric(5,2) |  |  |
| can_join_social_play | boolean |  |  |
| is_active | boolean |  |  |
| sort_order | smallint |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `plan_benefits`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| plan_id | bigint |  | membership_plans.id |
| description | text |  |  |
| sort_order | smallint |  |  |

## Table: `members`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_code | text |  |  |
| qr_token | text |  |  |
| user_id | bigint |  | users.id |
| full_name | text |  |  |
| date_of_birth | date |  |  |
| phone | text |  |  |
| email | text |  |  |
| address_line1 | text |  |  |
| address_line2 | text |  |  |
| city | text |  |  |
| postal_code | text |  |  |
| photo_url | text |  |  |
| emergency_contact_name | text |  |  |
| emergency_contact_phone | text |  |  |
| guardian_id | bigint |  | guardians.id |
| status | text |  |  |
| joined_on | date |  |  |
| registered_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `memberships`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_id | bigint |  | members.id |
| plan_id | bigint |  | membership_plans.id |
| start_date | date |  |  |
| end_date | date |  |  |
| status | text |  |  |
| started_as | text |  |  |
| previous_membership_id | bigint |  | memberships.id |
| auto_renew | boolean |  |  |
| fee_charged | numeric(10,2) |  |  |
| joining_fee_charged | numeric(10,2) |  |  |
| cancelled_at | timestamptz |  |  |
| cancelled_by | bigint |  | users.id |
| cancellation_reason | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `guests`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| source | text |  |  |
| converted_member_id | bigint |  | members.id |
| notes | text |  |  |
| created_at | timestamptz |  |  |

## Table: `business_clients`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| company_name | text |  |  |
| contact_person | text |  |  |
| email | text |  |  |
| phone | text |  |  |
| billing_address1 | text |  |  |
| billing_address2 | text |  |  |
| city | text |  |  |
| state | text |  |  |
| postal_code | text |  |  |
| tax_id | text |  |  |
| payment_terms_days | smallint |  |  |
| status | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `member_notes`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_id | bigint |  | members.id |
| note | text |  |  |
| is_pinned | boolean |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `sports`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| is_active | boolean |  |  |

## Table: `courts`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| sport_id | bigint |  | sports.id |
| surface | text |  |  |
| is_indoor | boolean |  |  |
| social_play_capacity | smallint |  |  |
| status | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `court_operating_hours`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| court_id | bigint |  | courts.id |
| day_of_week | smallint |  |  |
| open_time | time |  |  |
| close_time | time |  |  |

## Table: `court_rates`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| sport_id | bigint |  | sports.id |
| plan_id | bigint |  | membership_plans.id |
| applies_to | text |  |  |
| days_of_week | smallint[] |  |  |
| start_time | time |  |  |
| end_time | time |  |  |
| price | numeric(10,2) |  |  |
| valid_from | date |  |  |
| valid_to | date |  |  |
| is_active | boolean |  |  |

## Table: `court_reservations`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| court_id | bigint |  | courts.id |
| starts_at | timestamptz |  |  |
| ends_at | timestamptz |  |  |
| reservation_type | text |  |  |
| status | text |  |  |
| social_title | text |  |  |
| social_capacity | smallint |  |  |
| block_reason | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `bookings`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| booking_ref | text |  |  |
| reservation_id | bigint |  |  |
| reservation_type | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| membership_id | bigint |  | memberships.id |
| booked_via | text |  |  |
| booked_by | bigint |  | users.id |
| is_trial | boolean |  |  |
| rate_id | bigint |  | court_rates.id |
| price_basis | text |  |  |
| amount_charged | numeric(10,2) |  |  |
| status | text |  |  |
| checked_in_at | timestamptz |  |  |
| cancelled_at | timestamptz |  |  |
| cancelled_by | bigint |  | users.id |
| cancellation_reason | text |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `check_ins`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| member_id | bigint |  | members.id |
| booking_id | bigint |  | bookings.id |
| checked_in_at | timestamptz |  |  |
| method | text |  |  |
| recorded_by | bigint |  | users.id |
| notes | text |  |  |

## Table: `tax_rates`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| rate_pct | numeric(5,2) |  |  |
| is_active | boolean |  |  |

## Table: `product_categories`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| parent_id | bigint |  | product_categories.id |
| sort_order | smallint |  |  |
| is_active | boolean |  |  |

## Table: `products`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| category_id | bigint |  | product_categories.id |
| name | text |  |  |
| brand | text |  |  |
| description | text |  |  |
| base_price | numeric(12,2) |  |  |
| cost_price | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| image_url | text |  |  |
| is_listed_online | boolean |  |  |
| is_active | boolean |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `product_variants`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| product_id | bigint |  | products.id |
| sku | text |  |  |
| barcode | text |  |  |
| size | text |  |  |
| color | text |  |  |
| price_override | numeric(12,2) |  |  |
| stock_on_hand | integer |  |  |
| stock_reserved | integer |  |  |
| reorder_level | integer |  |  |
| is_active | boolean |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `suppliers`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| contact_person | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| address | text |  |  |
| tax_id | text |  |  |
| payment_terms_days | smallint |  |  |
| is_active | boolean |  |  |
| created_at | timestamptz |  |  |

## Table: `purchase_orders`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| po_number | text |  |  |
| supplier_id | bigint |  | suppliers.id |
| status | text |  |  |
| ordered_at | timestamptz |  |  |
| expected_on | date |  |  |
| received_at | timestamptz |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `purchase_order_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| purchase_order_id | bigint |  | purchase_orders.id |
| variant_id | bigint |  | product_variants.id |
| quantity_ordered | integer |  |  |
| quantity_received | integer |  |  |
| unit_cost | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |

## Table: `stock_movements`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| variant_id | bigint |  | product_variants.id |
| quantity_change | integer |  |  |
| reason | text |  |  |
| reference_type | text |  |  |
| reference_id | bigint |  |  |
| balance_after | integer |  |  |
| notes | text |  |  |
| performed_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `shop_orders`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_no | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| channel | text |  |  |
| fulfillment_type | text |  |  |
| status | text |  |  |
| taken_by | bigint |  | users.id |
| member_discount_pct | numeric(5,2) |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| delivery_fee | numeric(10,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| delivery_address_line1 | text |  |  |
| delivery_address_line2 | text |  |  |
| delivery_city | text |  |  |
| delivery_postal_code | text |  |  |
| delivery_phone | text |  |  |
| delivery_notes | text |  |  |
| assigned_delivery_to | bigint |  | employees.id |
| placed_at | timestamptz |  |  |
| ready_at | timestamptz |  |  |
| completed_at | timestamptz |  |  |
| cancelled_at | timestamptz |  |  |
| cancellation_reason | text |  |  |
| notes | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `shop_order_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_id | bigint |  | shop_orders.id |
| variant_id | bigint |  | product_variants.id |
| product_name | text |  |  |
| quantity | integer |  |  |
| unit_price | numeric(12,2) |  |  |
| discount_amount | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |

## Table: `bar_menu_categories`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| sort_order | smallint |  |  |
| is_active | boolean |  |  |

## Table: `bar_menu_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| category_id | bigint |  | bar_menu_categories.id |
| name | text |  |  |
| description | text |  |  |
| price | numeric(10,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| station | text |  |  |
| is_available | boolean |  |  |
| is_active | boolean |  |  |
| image_url | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `dining_tables`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| table_number | text |  |  |
| seats | smallint |  |  |
| zone | text |  |  |
| status | text |  |  |

## Table: `bar_tabs`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| tab_no | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| guest_name | text |  |  |
| table_id | bigint |  | dining_tables.id |
| status | text |  |  |
| opened_by | bigint |  | users.id |
| opened_at | timestamptz |  |  |
| settled_at | timestamptz |  |  |
| closed_by | bigint |  | users.id |

## Table: `bar_orders`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_no | text |  |  |
| tab_id | bigint |  | bar_tabs.id |
| table_id | bigint |  | dining_tables.id |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| taken_by | bigint |  | users.id |
| status | text |  |  |
| member_discount_pct | numeric(5,2) |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| notes | text |  |  |
| placed_at | timestamptz |  |  |
| served_at | timestamptz |  |  |
| cancelled_at | timestamptz |  |  |
| cancellation_reason | text |  |  |
| updated_at | timestamptz |  |  |

## Table: `bar_order_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| order_id | bigint |  | bar_orders.id |
| menu_item_id | bigint |  | bar_menu_items.id |
| item_name | text |  |  |
| quantity | integer |  |  |
| unit_price | numeric(10,2) |  |  |
| discount_amount | numeric(10,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(10,2) |  |  |
| line_total | numeric(10,2) |  |  |
| station | text |  |  |
| kitchen_status | text |  |  |
| special_instructions | text |  |  |
| ready_at | timestamptz |  |  |

## Table: `enquiries`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| full_name | text |  |  |
| company_name | text |  |  |
| phone | text |  |  |
| email | text |  |  |
| source | text |  |  |
| enquiry_type | text |  |  |
| interested_plan_id | bigint |  | membership_plans.id |
| interested_sport_id | bigint |  | sports.id |
| message | text |  |  |
| status | text |  |  |
| assigned_to | bigint |  | users.id |
| next_follow_up_at | timestamptz |  |  |
| trial_booking_id | bigint |  | bookings.id |
| converted_member_id | bigint |  | members.id |
| business_client_id | bigint |  | business_clients.id |
| lost_reason | text |  |  |
| closed_at | timestamptz |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `enquiry_activities`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| enquiry_id | bigint |  | enquiries.id |
| activity_type | text |  |  |
| summary | text |  |  |
| performed_by | bigint |  | users.id |
| occurred_at | timestamptz |  |  |

## Table: `quotes`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| quote_no | text |  |  |
| enquiry_id | bigint |  | enquiries.id |
| plan_id | bigint |  | membership_plans.id |
| business_client_id | bigint |  | business_clients.id |
| status | text |  |  |
| valid_until | date |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| sent_at | timestamptz |  |  |
| sent_via | text |  |  |
| accepted_at | timestamptz |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `quote_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| quote_id | bigint |  | quotes.id |
| description | text |  |  |
| quantity | numeric(10,2) |  |  |
| unit_price | numeric(12,2) |  |  |
| discount_amount | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |

## Table: `invoices`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| invoice_no | text |  |  |
| member_id | bigint |  | members.id |
| guest_id | bigint |  | guests.id |
| business_client_id | bigint |  | business_clients.id |
| bill_to_name | text |  |  |
| quote_id | bigint |  | quotes.id |
| status | text |  |  |
| issue_date | date |  |  |
| due_date | date |  |  |
| subtotal | numeric(12,2) |  |  |
| discount_total | numeric(12,2) |  |  |
| tax_total | numeric(12,2) |  |  |
| total_amount | numeric(12,2) |  |  |
| amount_paid | numeric(12,2) |  |  |
| balance_due | numeric(12,2) |  |  |
| notes | text |  |  |
| issued_by | bigint |  | users.id |
| voided_at | timestamptz |  |  |
| voided_by | bigint |  | users.id |
| void_reason | text |  |  |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `invoice_items`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| invoice_id | bigint |  | invoices.id |
| source | text |  |  |
| description | text |  |  |
| quantity | numeric(10,2) |  |  |
| unit_price | numeric(12,2) |  |  |
| discount_amount | numeric(12,2) |  |  |
| tax_rate_id | bigint |  | tax_rates.id |
| tax_amount | numeric(12,2) |  |  |
| line_total | numeric(12,2) |  |  |
| membership_id | bigint |  | memberships.id |
| booking_id | bigint |  | bookings.id |
| shop_order_id | bigint |  | shop_orders.id |
| bar_order_id | bigint |  | bar_orders.id |

## Table: `payments`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| receipt_no | text |  |  |
| invoice_id | bigint |  | invoices.id |
| amount | numeric(12,2) |  |  |
| method | text |  |  |
| status | text |  |  |
| gateway_name | text |  |  |
| transaction_ref | text |  |  |
| card_last4 | char(4) |  |  |
| received_by | bigint |  | users.id |
| paid_at | timestamptz |  |  |
| notes | text |  |  |
| created_at | timestamptz |  |  |

## Table: `refunds`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| payment_id | bigint |  | payments.id |
| amount | numeric(12,2) |  |  |
| method | text |  |  |
| reason | text |  |  |
| refunded_by | bigint |  | users.id |
| refunded_at | timestamptz |  |  |

## Table: `daily_closings`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| business_date | date |  |  |
| department | text |  |  |
| total_sales | numeric(12,2) |  |  |
| cash_total | numeric(12,2) |  |  |
| card_total | numeric(12,2) |  |  |
| upi_total | numeric(12,2) |  |  |
| online_total | numeric(12,2) |  |  |
| other_total | numeric(12,2) |  |  |
| opening_cash | numeric(12,2) |  |  |
| expected_cash | numeric(12,2) |  |  |
| counted_cash | numeric(12,2) |  |  |
| cash_variance | numeric(12,2) |  |  |
| closed_by | bigint |  | users.id |
| closed_at | timestamptz |  |  |
| notes | text |  |  |

## Table: `expense_categories`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| name | text |  |  |
| is_active | boolean |  |  |

## Table: `expenses`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| category_id | bigint |  | expense_categories.id |
| supplier_id | bigint |  | suppliers.id |
| purchase_order_id | bigint |  | purchase_orders.id |
| description | text |  |  |
| amount | numeric(12,2) |  |  |
| tax_amount | numeric(12,2) |  |  |
| expense_date | date |  |  |
| due_date | date |  |  |
| status | text |  |  |
| paid_at | timestamptz |  |  |
| payment_method | text |  |  |
| reference_no | text |  |  |
| receipt_url | text |  |  |
| recorded_by | bigint |  | users.id |
| created_at | timestamptz |  |  |
| updated_at | timestamptz |  |  |

## Table: `tax_returns`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| tax_type | text |  |  |
| period_start | date |  |  |
| period_end | date |  |  |
| tax_collected | numeric(12,2) |  |  |
| tax_credit | numeric(12,2) |  |  |
| net_payable | numeric(12,2) |  |  |
| status | text |  |  |
| due_date | date |  |  |
| filed_at | timestamptz |  |  |
| filed_by | bigint |  | users.id |
| paid_at | timestamptz |  |  |
| reference_no | text |  |  |
| notes | text |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `report_shares`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| report_type | text |  |  |
| period_start | date |  |  |
| period_end | date |  |  |
| snapshot | jsonb |  |  |
| share_token | text |  |  |
| recipient_name | text |  |  |
| recipient_email | text |  |  |
| expires_at | timestamptz |  |  |
| revoked_at | timestamptz |  |  |
| view_count | integer |  |  |
| created_by | bigint |  | users.id |
| created_at | timestamptz |  |  |

## Table: `notifications`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| recipient_user_id | bigint |  | users.id |
| recipient_contact | text |  |  |
| type | text |  |  |
| channel | text |  |  |
| title | text |  |  |
| body | text |  |  |
| entity_type | text |  |  |
| entity_id | bigint |  |  |
| dedupe_key | text |  |  |
| status | text |  |  |
| is_read | boolean |  |  |
| read_at | timestamptz |  |  |
| scheduled_for | timestamptz |  |  |
| sent_at | timestamptz |  |  |
| created_at | timestamptz |  |  |

## Table: `audit_logs`
| Column Name | Data Type | Primary Key | Foreign Key |
|-------------|-----------|-------------|-------------|
| id | bigint | Yes |  |
| user_id | bigint |  | users.id |
| action | text |  |  |
| entity_type | text |  |  |
| entity_id | bigint |  |  |
| old_values | jsonb |  |  |
| new_values | jsonb |  |  |
| ip_address | inet |  |  |
| user_agent | text |  |  |
| created_at | timestamptz |  |  |
