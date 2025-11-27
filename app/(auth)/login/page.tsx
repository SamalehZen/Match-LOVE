import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-semibold mb-1">Connexion</h1>
      <p className="text-sm text-neutral-600 mb-6">Ravi de vous revoir</p>
      <LoginForm />
      <p className="text-sm text-neutral-600 mt-6">
        Pas de compte ?{' '}
        <Link href="/register" className="text-blue-600 hover:underline">S'inscrire</Link>
      </p>
    </div>
  )
}
