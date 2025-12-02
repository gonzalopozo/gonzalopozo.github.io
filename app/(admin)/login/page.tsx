
export default function LoginPage() {
  
  return (
    <div className="grid items-center justify-center min-h-dvh">
      <form action="/api/auth/sign-in" method="POST" className="flex flex-col">
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" name="email" id="email" />
        </div>
        <div>
          <label htmlFor="pass">Password:</label>
          <input type="password" name="pass" id="pass" />
        </div>
        <input type="submit" value="Login" />
      </form>
    </div>
  )
}