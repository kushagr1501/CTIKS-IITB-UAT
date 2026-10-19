import Link from 'next/link';

export default function FacultyNotFound() {
  return (
    <section className="mx-auto max-w-shell px-6 py-24 text-center">
      <h1 className="font-display text-3xl text-ctiks-maroon">Profile unavailable</h1>
      <p className="my-5 text-stone-600">This faculty profile is not currently available.</p>
      <Link href="/people" className="font-semibold underline underline-offset-4">
        Back to People
      </Link>
    </section>
  );
}
