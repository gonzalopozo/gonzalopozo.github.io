import { signInAction } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <div className="grid items-center justify-center min-h-dvh">
      <form action={signInAction} className="flex flex-col">
        <h1>Login</h1>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" name="email" id="email" placeholder="email" />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" name="password" id="password" placeholder="password" />
        </div>
        <button type="submit">Login!</button>
      </form>
    </div>
  )
}