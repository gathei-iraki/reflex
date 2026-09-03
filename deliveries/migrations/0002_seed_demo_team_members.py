from django.db import migrations


DEMO_MEMBERS = [
    ("Demo Retailer", "0700000001", "RETAILER"),
    ("Demo Dispatcher", "0700000002", "DISPATCHER"),
    ("Demo Rider", "0700000003", "RIDER"),
]


def create_demo_members(apps, schema_editor):
    TeamMember = apps.get_model("deliveries", "TeamMember")

    for name, phone_number, role in DEMO_MEMBERS:
        TeamMember.objects.get_or_create(
            name=name,
            role=role,
            defaults={
                "phone_number": phone_number,
                "is_active": True,
            },
        )


def remove_demo_members(apps, schema_editor):
    TeamMember = apps.get_model("deliveries", "TeamMember")

    for name, phone_number, role in DEMO_MEMBERS:
        TeamMember.objects.filter(
            name=name,
            phone_number=phone_number,
            role=role,
        ).delete()


class Migration(migrations.Migration):
    dependencies = [("deliveries", "0001_initial")]

    operations = [
        migrations.RunPython(create_demo_members, remove_demo_members),
    ]
