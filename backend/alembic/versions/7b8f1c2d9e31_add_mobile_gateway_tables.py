"""add_mobile_gateway_tables

Revision ID: 7b8f1c2d9e31
Revises: 23c5d8198d8b
Create Date: 2026-04-26 18:07:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7b8f1c2d9e31"
down_revision: Union[str, None] = "23c5d8198d8b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "mobile_gateways",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("device_id", sa.String(), nullable=False),
        sa.Column("device_name", sa.String(), nullable=False),
        sa.Column("os_type", sa.String(), nullable=False),
        sa.Column("os_version", sa.String(), nullable=True),
        sa.Column("app_version", sa.String(), nullable=True),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("api_key", sa.String(), nullable=True),
        sa.Column("api_key_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("is_online", sa.Boolean(), nullable=True),
        sa.Column("last_seen", sa.DateTime(), nullable=True),
        sa.Column("latitude", sa.String(), nullable=True),
        sa.Column("longitude", sa.String(), nullable=True),
        sa.Column("last_location_update", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mobile_gateways_id"), "mobile_gateways", ["id"], unique=False)
    op.create_index(op.f("ix_mobile_gateways_device_id"), "mobile_gateways", ["device_id"], unique=True)

    op.create_table(
        "ble_sensors",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("mobile_gateway_id", sa.Integer(), nullable=False),
        sa.Column("sensor_id", sa.Integer(), nullable=True),
        sa.Column("mac_address", sa.String(), nullable=False),
        sa.Column("device_name", sa.String(), nullable=False),
        sa.Column("sensor_type", sa.String(), nullable=False),
        sa.Column("manufacturer", sa.String(), nullable=True),
        sa.Column("model", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("is_connected", sa.Boolean(), nullable=True),
        sa.Column("rssi", sa.Integer(), nullable=True),
        sa.Column("tx_power", sa.Integer(), nullable=True),
        sa.Column("last_temperature", sa.String(), nullable=True),
        sa.Column("last_humidity", sa.String(), nullable=True),
        sa.Column("first_reading_at", sa.DateTime(), nullable=True),
        sa.Column("last_reading_time", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["mobile_gateway_id"], ["mobile_gateways.id"]),
        sa.ForeignKeyConstraint(["sensor_id"], ["sensors.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ble_sensors_id"), "ble_sensors", ["id"], unique=False)
    op.create_index(op.f("ix_ble_sensors_mac_address"), "ble_sensors", ["mac_address"], unique=True)

    op.create_table(
        "ble_readings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("mobile_gateway_id", sa.Integer(), nullable=False),
        sa.Column("ble_sensor_id", sa.Integer(), nullable=False),
        sa.Column("temperature", sa.String(), nullable=True),
        sa.Column("humidity", sa.String(), nullable=True),
        sa.Column("rssi", sa.Integer(), nullable=True),
        sa.Column("battery_level", sa.Integer(), nullable=True),
        sa.Column("latitude", sa.String(), nullable=True),
        sa.Column("longitude", sa.String(), nullable=True),
        sa.Column("timestamp", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["mobile_gateway_id"], ["mobile_gateways.id"]),
        sa.ForeignKeyConstraint(["ble_sensor_id"], ["ble_sensors.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ble_readings_id"), "ble_readings", ["id"], unique=False)
    op.create_index(op.f("ix_ble_readings_timestamp"), "ble_readings", ["timestamp"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ble_readings_timestamp"), table_name="ble_readings")
    op.drop_index(op.f("ix_ble_readings_id"), table_name="ble_readings")
    op.drop_table("ble_readings")

    op.drop_index(op.f("ix_ble_sensors_mac_address"), table_name="ble_sensors")
    op.drop_index(op.f("ix_ble_sensors_id"), table_name="ble_sensors")
    op.drop_table("ble_sensors")

    op.drop_index(op.f("ix_mobile_gateways_device_id"), table_name="mobile_gateways")
    op.drop_index(op.f("ix_mobile_gateways_id"), table_name="mobile_gateways")
    op.drop_table("mobile_gateways")
