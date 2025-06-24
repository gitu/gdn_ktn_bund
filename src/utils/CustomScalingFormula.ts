/**
 * Custom Scaling Formula Parser and Evaluator
 *
 * Supports mathematical expressions with scaling factors like:
 * - "1.5*pop+30*total_area"
 * - "pop/1000"
 * - "2*employment+0.5*area"
 */

import type { StatsAvailabilityInfo } from '@/types/StatsData'
import type { MultiLanguageLabels } from '@/types/DataStructures'
import {
  ScalingOptimization,
  type OptimizationTarget,
  type OptimizationResult,
  type OptimizationOptions,
} from './ScalingOptimization'

// Constants
export const CUSTOM_SCALING_PREFIX = 'custom:'

export interface CustomScalingResult {
  isValid: boolean
  result?: number
  error?: string
  usedFactors?: string[]
}

export interface FormulaValidationResult {
  isValid: boolean
  error?: string
  usedFactors?: string[]
  formula?: string
}

export interface ScalingVariable {
  id: string
  name: MultiLanguageLabels
  value: number
  unit: MultiLanguageLabels
}

/**
 * Parse and validate a custom scaling formula
 */
export class CustomScalingFormula {
  private static readonly SUPPORTED_OPERATORS = ['+', '-', '*', '/', '(', ')']
  private static readonly OPERATOR_PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 }

  /**
   * Validate a formula expression and return available variables
   */
  static validateFormula(
    formula: string,
    availableStats: StatsAvailabilityInfo[],
  ): FormulaValidationResult {
    try {
      // Clean and normalize the formula
      const normalizedFormula = this.normalizeFormula(formula)

      if (!normalizedFormula.trim()) {
        return { isValid: false, error: 'Formula cannot be empty' }
      }

      // Extract variables from formula
      const variables = this.extractVariables(normalizedFormula)

      if (variables.length === 0) {
        return { isValid: false, error: 'Formula must contain at least one scaling variable' }
      }

      // Validate that all variables exist in available stats
      const availableStatsIds = new Set(availableStats.map((stat) => stat.id))
      const invalidVariables = variables.filter((variable) => !availableStatsIds.has(variable))

      if (invalidVariables.length > 0) {
        return {
          isValid: false,
          error: `Unknown scaling variables: ${invalidVariables.join(', ')}. Available: ${Array.from(availableStatsIds).join(', ')}`,
        }
      }

      // Validate expression syntax
      const syntaxValidation = this.validateSyntax(normalizedFormula, variables)
      if (!syntaxValidation.isValid) {
        return syntaxValidation
      }

      return {
        isValid: true,
        formula: normalizedFormula,
        usedFactors: variables,
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      }
    }
  }

  /**
   * Evaluate a formula with provided scaling variables
   */
  static evaluateFormula(
    formula: string,
    scalingVariables: Map<string, ScalingVariable>,
  ): CustomScalingResult {
    try {
      const validation = this.validateFormula(
        formula,
        Array.from(scalingVariables.values()).map((v) => ({
          id: v.id,
          name: v.name,
          unit: v.unit,
          type: 'scaling',
          description: v.name,
          availableKtnYears: [],
          availableGdnYears: [],
          source: '',
          lastUpdate: '',
        })),
      )

      if (!validation.isValid) {
        return {
          isValid: false,
          error: validation.error,
          usedFactors: validation.usedFactors,
        }
      }

      // Replace variables with their values
      let evaluableExpression = validation.formula!
      const usedFactors: string[] = []

      for (const [variableId, variable] of scalingVariables) {
        if (validation.usedFactors?.includes(variableId)) {
          // Use word boundaries to avoid partial replacements
          const regex = new RegExp(`\\b${this.escapeRegExp(variableId)}\\b`, 'g')
          evaluableExpression = evaluableExpression.replace(regex, variable.value.toString())
          usedFactors.push(variableId)
        }
      }

      // Safely evaluate the mathematical expression
      const result = this.safeEvaluate(evaluableExpression)

      if (isNaN(result) || !isFinite(result)) {
        return {
          isValid: false,
          error: 'Formula evaluation resulted in invalid number',
          usedFactors,
        }
      }

      return {
        isValid: true,
        result,
        usedFactors,
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Evaluation error',
        usedFactors: [],
      }
    }
  }

  /**
   * Get user-friendly display name for a formula
   */
  static getFormulaDisplayName(
    formula: string,
    availableStats: StatsAvailabilityInfo[],
    locale: string = 'en',
  ): string {
    try {
      const validation = this.validateFormula(formula, availableStats)
      if (!validation.isValid) {
        return `Custom: ${formula}`
      }

      let displayFormula = formula

      // Replace variable IDs with human-readable names
      availableStats.forEach((stat) => {
        if (validation.usedFactors?.includes(stat.id)) {
          const name = stat.name[locale as keyof MultiLanguageLabels] || stat.name.en || stat.id
          const regex = new RegExp(`\\b${this.escapeRegExp(stat.id)}\\b`, 'g')
          displayFormula = displayFormula.replace(regex, name)
        }
      })

      return `Custom: ${displayFormula}`
    } catch {
      return `Custom: ${formula}`
    }
  }

  /**
   * Normalize formula by removing spaces and standardizing format
   */
  private static normalizeFormula(formula: string): string {
    return formula
      .trim()
      .replace(/\s+/g, '') // Remove all whitespace
      .replace(/([+\-*/()])/g, ' $1 ') // Add spaces around operators
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .trim()
  }

  /**
   * Extract variable names from the formula
   */
  private static extractVariables(formula: string): string[] {
    // Remove operators and numbers, split by spaces, filter out empty strings
    const tokens = formula
      .split(/[+\-*/()\s]+/)
      .filter((token) => token.trim() !== '' && isNaN(Number(token)))

    // Return unique variables
    return Array.from(new Set(tokens))
  }

  /**
   * Validate expression syntax
   */
  private static validateSyntax(formula: string, variables: string[]): FormulaValidationResult {
    // Check for balanced parentheses
    let parenthesesCount = 0
    const tokens = formula.split(/\s+/)

    for (const token of tokens) {
      if (token === '(') {
        parenthesesCount++
      } else if (token === ')') {
        parenthesesCount--
        if (parenthesesCount < 0) {
          return { isValid: false, error: 'Unbalanced parentheses: too many closing parentheses' }
        }
      }
    }

    if (parenthesesCount !== 0) {
      return { isValid: false, error: 'Unbalanced parentheses' }
    }

    // Check for invalid sequences (like consecutive operators)
    for (let i = 0; i < tokens.length - 1; i++) {
      const current = tokens[i]
      const next = tokens[i + 1]

      if (
        this.SUPPORTED_OPERATORS.includes(current) &&
        this.SUPPORTED_OPERATORS.includes(next) &&
        current !== ')' &&
        next !== '('
      ) {
        return { isValid: false, error: `Invalid operator sequence: ${current} ${next}` }
      }
    }

    // Check if formula starts or ends with an operator (except parentheses and leading minus)
    const firstToken = tokens[0]
    const lastToken = tokens[tokens.length - 1]

    // Allow minus at the beginning for negative numbers, but not other operators
    if (firstToken && ['+', '*', '/'].includes(firstToken)) {
      return { isValid: false, error: `Formula cannot start with operator: ${firstToken}` }
    }

    if (lastToken && ['+', '-', '*', '/'].includes(lastToken)) {
      return { isValid: false, error: `Formula cannot end with operator: ${lastToken}` }
    }

    return { isValid: true, usedFactors: variables }
  }

  /**
   * Safely evaluate a mathematical expression without using eval()
   */
  private static safeEvaluate(expression: string): number {
    // Convert infix to postfix notation (Shunting Yard algorithm)
    const postfix = this.infixToPostfix(expression)

    // Evaluate postfix expression
    const stack: number[] = []

    for (const token of postfix) {
      if (!isNaN(Number(token))) {
        stack.push(Number(token))
      } else if (this.SUPPORTED_OPERATORS.includes(token)) {
        if (stack.length < 2) {
          throw new Error('Invalid expression: insufficient operands')
        }

        const b = stack.pop()!
        const a = stack.pop()!

        switch (token) {
          case '+':
            stack.push(a + b)
            break
          case '-':
            stack.push(a - b)
            break
          case '*':
            stack.push(a * b)
            break
          case '/':
            if (b === 0) {
              throw new Error('Division by zero')
            }
            stack.push(a / b)
            break
          default:
            throw new Error(`Unsupported operator: ${token}`)
        }
      }
    }

    if (stack.length !== 1) {
      throw new Error('Invalid expression: malformed')
    }

    return stack[0]
  }

  /**
   * Convert infix notation to postfix notation using Shunting Yard algorithm
   */
  private static infixToPostfix(expression: string): string[] {
    const tokens = expression.split(/\s+/).filter((token) => token !== '')
    const output: string[] = []
    const operators: string[] = []

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]

      if (!isNaN(Number(token))) {
        output.push(token)
      } else if (token === '(') {
        operators.push(token)
      } else if (token === ')') {
        while (operators.length > 0 && operators[operators.length - 1] !== '(') {
          output.push(operators.pop()!)
        }
        operators.pop() // Remove '('
      } else if (this.SUPPORTED_OPERATORS.includes(token)) {
        // Handle unary minus (negative numbers)
        if (token === '-' && (i === 0 || ['(', '+', '-', '*', '/'].includes(tokens[i - 1]))) {
          // This is a unary minus, convert to binary operation with 0
          output.push('0')
          operators.push('-')
        } else {
          while (
            operators.length > 0 &&
            operators[operators.length - 1] !== '(' &&
            this.OPERATOR_PRECEDENCE[token as keyof typeof this.OPERATOR_PRECEDENCE] <=
              this.OPERATOR_PRECEDENCE[
                operators[operators.length - 1] as keyof typeof this.OPERATOR_PRECEDENCE
              ]
          ) {
            output.push(operators.pop()!)
          }
          operators.push(token)
        }
      }
    }

    while (operators.length > 0) {
      output.push(operators.pop()!)
    }

    return output
  }

  /**
   * Generate optimized scaling formula based on financial data
   */
  static generateOptimizedFormula(
    targets: OptimizationTarget[],
    availableStats: StatsAvailabilityInfo[],
    options: OptimizationOptions = {},
  ): OptimizationResult {
    return ScalingOptimization.optimizeScalingFormula(targets, availableStats, options)
  }

  /**
   * Escape special characters for RegExp
   */
  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}
