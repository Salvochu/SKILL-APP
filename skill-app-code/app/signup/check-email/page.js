export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold text-black dark:text-white">
        Check your inbox
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        We sent you a confirmation link. Open it to finish setting up your
        account, then sign in.
      </p>
    </main>
  );
}
