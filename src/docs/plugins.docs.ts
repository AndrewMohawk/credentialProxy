/**
 * @swagger
 * /admin/plugins:
 *   get:
 *     summary: List all available plugins
 *     description: Retrieve a list of all available credential plugins
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available plugins
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 plugins:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique identifier for the plugin
 *                       name:
 *                         type: string
 *                         description: Human-readable name of the plugin
 *                       description:
 *                         type: string
 *                         description: Description of the plugin's purpose
 *                       version:
 *                         type: string
 *                         description: Version of the plugin
 *                       supportedOperations:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               description: Name of the operation
 *                             description:
 *                               type: string
 *                               description: Description of what the operation does
 *                             requiredParams:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               description: List of required parameters for the operation
 *                             optionalParams:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               description: List of optional parameters for the operation
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 * /admin/plugins/{id}:
 *   get:
 *     summary: Get plugin details
 *     description: Retrieve detailed information about a specific plugin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the plugin to retrieve
 *     responses:
 *       200:
 *         description: Plugin details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 plugin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique identifier for the plugin
 *                     name:
 *                       type: string
 *                       description: Human-readable name of the plugin
 *                     description:
 *                       type: string
 *                       description: Description of the plugin's purpose
 *                     version:
 *                       type: string
 *                       description: Version of the plugin
 *                     credentialSchema:
 *                       type: object
 *                       description: JSON schema defining the credential structure
 *                     supportedOperations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Name of the operation
 *                           description:
 *                             type: string
 *                             description: Description of what the operation does
 *                           requiredParams:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: List of required parameters for the operation
 *                           optionalParams:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: List of optional parameters for the operation
 *                     supportedPolicies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             description: Type of policy supported
 *                           description:
 *                             type: string
 *                             description: Description of the policy
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// This file only contains JSDoc comments for Swagger 