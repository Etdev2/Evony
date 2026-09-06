import { SignInForm } from "@/components/sign-in-form";

export default function SignInPage() {
  return (
    <main className="shell narrow">
      <section className="hero">
        <p className="eyebrow">Evony Scout</p>
        <h1>Sign in</h1>
        <p className="lede">Use a passwordless email link to access your scouting workspace.</p>
        <SignInForm />
      </section>
    </main>
  );
}
