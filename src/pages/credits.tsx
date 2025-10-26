import React from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'

const packages = [
  { name: 'Starter Pack', tokens: 1000, price: 4.99, perK: 4.99, features: ['10 worksheets (~10 × 100 tokens)', 'Tokens never expire', 'Use anytime, refund available'] },
  { name: 'Pro Pack', tokens: 5000, price: 19.99, perK: 3.998, save: 'Save $1.00 with 5% discount', features: ['50 worksheets (~50 × 100 tokens)', 'Tokens never expire', 'Use anytime, refund available'], popular: true },
  { name: 'Pro Plus Pack', tokens: 10000, price: 34.99, perK: 3.499, save: 'Save $3.50 with 10% discount', features: ['100 worksheets (~100 × 100 tokens)', 'Tokens never expire', 'Use anytime, refund available'] },
  { name: 'Enterprise Pack', tokens: 25000, price: 79.99, perK: 3.2, save: 'Save $12.00 with 15% discount', features: ['250 worksheets (~250 × 100 tokens)', 'Tokens never expire', 'Use anytime, refund available'] },
  { name: 'Mega Pack', tokens: 50000, price: 139.99, perK: 2.8, save: 'Save $28.00 with 20% discount', features: ['500 worksheets (~500 × 100 tokens)', 'Tokens never expire', 'Use anytime, refund available'] },
]

export default function CreditsPage() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Affordable Token Packages</h1>
          <p className="text-gray-600">Choose the right plan for your worksheet generation needs</p>
          <p className="text-gray-700 text-sm mt-2">Each token is used for AI-powered worksheet generation. Unused tokens never expire.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((p, idx) => (
            <div key={idx} className={`border rounded-lg p-4 bg-white ${p.popular ? 'ring-2 ring-blue-400' : ''}`}>
              {p.popular && <div className="text-xs inline-block mb-2 px-2 py-1 bg-blue-100 text-blue-800 rounded">Most Popular</div>}
              <h2 className="text-xl font-semibold text-gray-900">{p.name}</h2>
              <div className="mt-2">
                <p className="text-sm text-gray-600">Tokens Included</p>
                <p className="text-2xl font-bold text-gray-900">{(p.tokens/1000).toFixed(0)}K</p>
                <p className="text-sm text-gray-600">{p.tokens.toLocaleString()} tokens</p>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-600">Price per Package</p>
                <p className="text-2xl font-bold text-gray-900">${p.price.toFixed(2)}</p>
                <p className="text-sm text-gray-600">${p.perK.toFixed(3)} per 1K tokens</p>
                {p.save && <p className="text-xs text-green-700 mt-1">{p.save}</p>}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                {p.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
              <div className="mt-4">
                <Button onClick={() => alert('PayPal integration coming soon. Configure PAYPAL_CLIENT_ID and enable server routes.')} className="w-full">Buy Now</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
          <div className="space-y-2 text-gray-700 text-sm">
            <p><strong>How many tokens does each worksheet cost?</strong><br/>Token cost varies by worksheet type and complexity. Most worksheets cost 100-200 tokens. You&apos;ll be notified of the token cost before generation.</p>
            <p><strong>Do tokens expire?</strong><br/>No! Your tokens never expire. Use them anytime at your own pace.</p>
            <p><strong>Can I get a refund?</strong><br/>Yes. If you&apos;re not satisfied with your purchase, contact us within 30 days for a full refund.</p>
            <p><strong>What happens when I run out of tokens?</strong><br/>When your balance runs low, you can purchase more tokens anytime. Recharge your account instantly.</p>
            <p><strong>Is there a monthly subscription?</strong><br/>No subscription required. Pay only for what you use. Buy tokens once and use them whenever you want.</p>
            <p><strong>Do you offer discounts for bulk purchases?</strong><br/>Yes! Larger packages come with built-in discounts. The Mega Pack offers the best value at 20% savings.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
