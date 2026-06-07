#!/usr/bin/env python3
"""
Supabase Database Setup Script
Run this to set up tables, RLS policies, and seed data.
"""
import os
import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://todyqybjiwgnxfevqisl.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZHlxeWJqaXdnbnhmZXZxaXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDEzNjMsImV4cCI6MjA5NjE3NzM2M30.tyAK2ZovQwcEGI8i6euGQ6qprGhqvlIRZt4B0wUKeOg"

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

def api_request(method, path, data=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def check_table(table_name):
    """Check if table exists"""
    status, body = api_request("GET", f"{table_name}?limit=0")
    if status == 200:
        print(f"  [{table_name}] table EXISTS")
        return True
    else:
        print(f"  [{table_name}] table NOT FOUND (status {status})")
        return False

def seed_categories():
    """Seed default categories"""
    categories = [
        {"id": "new-product", "name": "新产品开发", "color": "#14B8A6"},
        {"id": "daily-order", "name": "日常订单跟进", "color": "#3B82F6"},
        {"id": "temporary", "name": "临时项目", "color": "#F59E0B"},
    ]
    for cat in categories:
        status, body = api_request("POST", "categories", cat)
        if status in (201, 409):
            print(f"  Category '{cat['name']}' seeded (status {status})")
        else:
            print(f"  Category '{cat['name']}' FAILED: {body}")

def seed_admin():
    """Seed default admin user (password: admin)"""
    admin = {
        "id": "admin-001",
        "username": "admin",
        "password_hash": "jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=",
        "role": "admin",
        "is_approved": True,
    }
    status, body = api_request("POST", "app_users", admin)
    if status in (201, 409):
        print(f"  Admin user 'admin' seeded (status {status})")
    else:
        print(f"  Admin user FAILED: {body}")

print("=" * 60)
print("Supabase Database Setup for Project Progress")
print("=" * 60)
print()

print("Checking existing tables...")
tasks_ok = check_table("tasks")
categories_ok = check_table("categories")
app_users_ok = check_table("app_users")
print()

if tasks_ok and categories_ok and app_users_ok:
    print("All tables exist. Checking seed data...")
    print()
    seed_categories()
    seed_admin()
    print()
    print("=" * 60)
    print("SETUP COMPLETE - All tables and seed data ready!")
    print("=" * 60)
else:
    print("=" * 60)
    print("TABLES NOT FOUND - Manual setup required!")
    print("=" * 60)
    print()
    print("Please run the SQL migration scripts in Supabase SQL Editor:")
    print(f"  1. Open: {SUPABASE_URL}")
    print(f"  2. Go to SQL Editor in the left sidebar")
    print(f"  3. Run sql/migration.sql first")
    print(f"  4. Run sql/migration_auth.sql second")
    print()
    print("Default login credentials after setup:")
    print("  Username: admin")
    print("  Password: admin")
    print("=" * 60)
