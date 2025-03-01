/**
 * @swagger
 * /policies:
 *   get:
 *     summary: Get all policies
 *     description: Retrieve a list of all policies
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of policies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 policies:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       rules:
 *                         type: array
 *                         items:
 *                           type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   post:
 *     summary: Create a new policy
 *     description: Create a new policy to control access to credentials
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - rules
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the policy
 *               description:
 *                 type: string
 *                 description: Description of the policy
 *               rules:
 *                 type: array
 *                 description: Array of policy rules
 *                 items:
 *                   type: object
 *                   required:
 *                     - effect
 *                     - actions
 *                     - resources
 *                   properties:
 *                     effect:
 *                       type: string
 *                       enum: [allow, deny]
 *                       description: Whether to allow or deny the actions
 *                     actions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of actions to allow/deny
 *                     resources:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of resources the rule applies to
 *                     conditions:
 *                       type: object
 *                       description: Optional conditions for the rule
 *     responses:
 *       201:
 *         description: Policy created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 policy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     rules:
 *                       type: array
 *                       items:
 *                         type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 * /policies/{id}:
 *   get:
 *     summary: Get policy by ID
 *     description: Get a specific policy by its ID
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the policy to retrieve
 *     responses:
 *       200:
 *         description: Policy retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 policy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     rules:
 *                       type: array
 *                       items:
 *                         type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   put:
 *     summary: Update policy
 *     description: Update an existing policy
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the policy to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the policy
 *               description:
 *                 type: string
 *                 description: Description of the policy
 *               rules:
 *                 type: array
 *                 description: Array of policy rules
 *                 items:
 *                   type: object
 *                   properties:
 *                     effect:
 *                       type: string
 *                       enum: [allow, deny]
 *                       description: Whether to allow or deny the actions
 *                     actions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of actions to allow/deny
 *                     resources:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of resources the rule applies to
 *                     conditions:
 *                       type: object
 *                       description: Optional conditions for the rule
 *     responses:
 *       200:
 *         description: Policy updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 policy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     rules:
 *                       type: array
 *                       items:
 *                         type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   delete:
 *     summary: Delete policy
 *     description: Delete a policy by its ID
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the policy to delete
 *     responses:
 *       200:
 *         description: Policy deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Policy deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /policies/{policyId}/applications/{applicationId}:
 *   post:
 *     summary: Attach policy to application
 *     description: Attach a policy to an application
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the policy
 *       - in: path
 *         name: applicationId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the application
 *     responses:
 *       200:
 *         description: Policy attached to application successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Policy attached to application successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   delete:
 *     summary: Detach policy from application
 *     description: Detach a policy from an application
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the policy
 *       - in: path
 *         name: applicationId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the application
 *     responses:
 *       200:
 *         description: Policy detached from application successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Policy detached from application successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// This file only contains JSDoc comments for Swagger 