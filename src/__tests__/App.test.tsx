import { render } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })

  it('renders the canvas element', () => {
    const { getByTestId } = render(<App />)
    expect(getByTestId('canvas')).toBeInTheDocument()
  })

  it('renders the title', () => {
    const { getByText } = render(<App />)
    expect(getByText('sonus-pointer')).toBeInTheDocument()
  })
})
