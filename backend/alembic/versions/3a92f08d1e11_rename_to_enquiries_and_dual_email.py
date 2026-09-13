"""rename contact_messages to enquiries and add dual email fields

Revision ID: 3a92f08d1e11
Revises: 178b8156b745
Create Date: 2026-09-12 21:18:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a92f08d1e11'
down_revision: Union[str, Sequence[str], None] = '178b8156b745'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'contact_messages' in tables and 'enquiries' not in tables:
        op.rename_table('contact_messages', 'enquiries')
    elif 'enquiries' not in tables:
        op.create_table(
            'enquiries',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('user_id', sa.Uuid(), nullable=True),
            sa.Column('name', sa.String(length=200), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('phone', sa.String(length=50), nullable=True),
            sa.Column('service_slug', sa.String(length=100), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('status', sa.String(length=20), server_default='new', nullable=False),
            sa.Column('client_ack_status', sa.String(length=20), server_default='pending', nullable=False),
            sa.Column('company_email_id', sa.String(length=255), nullable=True),
            sa.Column('client_email_id', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

    # Re-inspect to see current columns in enquiries
    inspector = sa.inspect(bind)
    cols = [c['name'] for c in inspector.get_columns('enquiries')]

    with op.batch_alter_table('enquiries', schema=None) as batch_op:
        if 'service_slug' not in cols:
            batch_op.add_column(sa.Column('service_slug', sa.String(length=100), nullable=False, server_default='project-planning'))
        if 'ip_address' not in cols:
            batch_op.add_column(sa.Column('ip_address', sa.String(length=45), nullable=True))
        if 'client_ack_status' not in cols:
            batch_op.add_column(sa.Column('client_ack_status', sa.String(length=20), nullable=False, server_default='pending'))
        if 'company_email_id' not in cols:
            batch_op.add_column(sa.Column('company_email_id', sa.String(length=255), nullable=True))
        if 'client_email_id' not in cols:
            batch_op.add_column(sa.Column('client_email_id', sa.String(length=255), nullable=True))
        if 'phone' not in cols:
            batch_op.add_column(sa.Column('phone', sa.String(length=50), nullable=True))

        try:
            batch_op.create_index('idx_enquiries_created_at', ['created_at'], unique=False)
        except Exception:
            pass
        try:
            batch_op.create_index('idx_enquiries_service_slug', ['service_slug'], unique=False)
        except Exception:
            pass


def downgrade() -> None:
    with op.batch_alter_table('enquiries', schema=None) as batch_op:
        try:
            batch_op.drop_index('idx_enquiries_service_slug')
            batch_op.drop_index('idx_enquiries_created_at')
        except Exception:
            pass
        batch_op.drop_column('client_email_id')
        batch_op.drop_column('company_email_id')
        batch_op.drop_column('client_ack_status')
        batch_op.drop_column('ip_address')
        batch_op.drop_column('service_slug')
    op.rename_table('enquiries', 'contact_messages')
