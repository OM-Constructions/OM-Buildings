"""add phone last_login and project details

Revision ID: 178b8156b745
Revises: 401e38f92e10
Create Date: 2026-09-12 20:32:17.809470

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '178b8156b745'
down_revision: Union[str, Sequence[str], None] = '401e38f92e10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('phone', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('last_login_at', sa.DateTime(), nullable=True))

    with op.batch_alter_table('contact_messages', schema=None) as batch_op:
        batch_op.add_column(sa.Column('phone', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('estimated_budget', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('location', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('timeline', sa.String(length=100), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('contact_messages', schema=None) as batch_op:
        batch_op.drop_column('timeline')
        batch_op.drop_column('location')
        batch_op.drop_column('estimated_budget')
        batch_op.drop_column('phone')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('last_login_at')
        batch_op.drop_column('phone')
