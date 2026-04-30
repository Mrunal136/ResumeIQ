"""Reset demo data from the ResumeIQ MongoDB database.

This script removes app-generated records from the collections used by the
current hiring flow:
- users
- resumes
- jobs
- applications

It defaults to dry-run mode. Pass ``--yes`` to actually delete data.
"""

from __future__ import annotations

import argparse
import asyncio
import os
from dataclasses import dataclass

from motor.motor_asyncio import AsyncIOMotorClient


DEFAULT_COLLECTIONS = ("users", "resumes", "jobs", "applications")


@dataclass
class ResetResult:
    collection: str
    deleted_count: int


async def reset_collections(uri: str, db_name: str, collections: tuple[str, ...], apply: bool) -> list[ResetResult]:
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    results: list[ResetResult] = []

    try:
        await client.admin.command("ping")
        for name in collections:
            count = await db[name].count_documents({})
            if apply:
                await db[name].delete_many({})
            results.append(ResetResult(collection=name, deleted_count=count))
    finally:
        client.close()

    return results


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Reset ResumeIQ demo data.")
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Actually delete data. Without this flag the script only previews counts.",
    )
    parser.add_argument(
        "--collections",
        nargs="*",
        default=list(DEFAULT_COLLECTIONS),
        help="Collections to clear. Defaults to the main app collections.",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "resumeiq")

    results = await reset_collections(uri, db_name, tuple(args.collections), apply=args.yes)

    mode = "deleted" if args.yes else "would delete"
    print(f"Database: {db_name}")
    for result in results:
        print(f"{result.collection}: {mode} {result.deleted_count} document(s)")

    if not args.yes:
        print("\nDry run only. Re-run with --yes to apply the reset.")


if __name__ == "__main__":
    asyncio.run(main())
