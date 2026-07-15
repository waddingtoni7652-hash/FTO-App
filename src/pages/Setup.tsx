import { useState, type FormEvent } from 'react'
import { db, hashPin } from '../db'
import { useAuth } from '../auth'

/** First-run setup: creates the initial administrator account. */
export default function Setup() {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [badgeNo, setBadgeNo] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.')
      return
    }
    const id = await db.users.add({
      name: name.trim(),
      badgeNo: badgeNo.trim(),
      role: 'admin',
      pinHash: await hashPin(pin),
      pin,
      active: true,
      createdAt: new Date().toISOString()
    })
    await login(id, pin)
  }

  return (
    <div className="center">
      <form className="card narrow" onSubmit={submit}>
        <h1>Welcome</h1>
        <p className="muted">
          First-time setup: create the <strong>administrator account</strong> for this device. The admin
          creates FTO and trainee accounts and assigns trainees to FTOs. All data is stored locally on
          this device.
        </p>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Officer J. Smith" />
        </label>
        <label>
          Badge / ID number
          <input value={badgeNo} onChange={(e) => setBadgeNo(e.target.value)} required placeholder="1234" />
        </label>
        <label>
          PIN (min 4 digits)
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Create administrator account</button>
      </form>
    </div>
  )
}
