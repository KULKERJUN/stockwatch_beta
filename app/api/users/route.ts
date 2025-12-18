import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import { User } from '@/lib/models/User';

// GET - Fetch all users OR single user by query parameter
export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');
        const email = searchParams.get('email');

        if (name) {
            const user = await User.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') }
            }).select('-password');

            if (!user) {
                return NextResponse.json({
                    success: false,
                    error: `User with name '${name}' not found`
                }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                data: user
            }, { status: 200 });
        }

        if (email) {
            const user = await User.findOne({ email }).select('-password');

            if (!user) {
                return NextResponse.json({
                    success: false,
                    error: `User with email '${email}' not found`
                }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                data: user
            }, { status: 200 });
        }

        const users = await User.find({}).select('-password');

        return NextResponse.json({
            success: true,
            count: users.length,
            data: users
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch users'
        }, { status: 500 });
    }
}

// POST - Create new user
export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { name, email, password } = body;

        if (!name || !email) {
            return NextResponse.json({
                success: false,
                error: 'Name and email are required'
            }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({
                success: false,
                error: 'User with this email already exists'
            }, { status: 400 });
        }

        const newUser = await User.create({
            name,
            email,
            password,
            emailVerified: false
        });

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to create user'
        }, { status: 500 });
    }
}

// PATCH - Update user by query parameter
export async function PATCH(request: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const body = await request.json();

        if (!name && !email) {
            return NextResponse.json({
                success: false,
                error: 'Name or email query parameter is required'
            }, { status: 400 });
        }

        body.updatedAt = new Date();

        let query: any = {};
        if (name) {
            query.name = { $regex: new RegExp(`^${name}$`, 'i') };
        } else if (email) {
            query.email = email;
        }

        const updatedUser = await User.findOneAndUpdate(
            query,
            { $set: body },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update user'
        }, { status: 500 });
    }
}

// PUT - Replace user by query parameter
export async function PUT(request: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const body = await request.json();
        const { name: newName, email: newEmail, password } = body;

        if (!name && !email) {
            return NextResponse.json({
                success: false,
                error: 'Name or email query parameter is required'
            }, { status: 400 });
        }

        if (!newName || !newEmail) {
            return NextResponse.json({
                success: false,
                error: 'Name and email are required in body'
            }, { status: 400 });
        }

        let query: any = {};
        if (name) {
            query.name = { $regex: new RegExp(`^${name}$`, 'i') };
        } else if (email) {
            query.email = email;
        }

        const updatedUser = await User.findOneAndUpdate(
            query,
            {
                name: newName,
                email: newEmail,
                password,
                emailVerified: false,
                updatedAt: new Date()
            },
            { new: true, overwrite: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'User replaced successfully',
            data: updatedUser
        }, { status: 200 });
    } catch (error) {
        console.error('Error replacing user:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to replace user'
        }, { status: 500 });
    }
}

// DELETE - Remove user by email in request body
export async function DELETE(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({
                success: false,
                error: 'Email is required in request body'
            }, { status: 400 });
        }

        const deletedUser = await User.findOneAndDelete({ email });

        if (!deletedUser) {
            return NextResponse.json({
                success: false,
                error: `User with email '${email}' not found`
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully',
            data: {
                name: deletedUser.name,
                email: deletedUser.email
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to delete user'
        }, { status: 500 });
    }
}