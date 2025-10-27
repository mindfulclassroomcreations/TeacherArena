import React from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function ExcelPage() {
	return (
		<ProtectedRoute>
			<Layout>
				<div className="max-w-3xl mx-auto p-6">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Excel Exports</h1>
					<p className="text-gray-700">
						This page is a placeholder. Please use the Tables page to export your lessons to Excel.
					</p>
				</div>
			</Layout>
		</ProtectedRoute>
	)
}

