const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const { getDefaultCapabilities } = require('./src/utils/capabilities');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data.');

    const passwordHash = await bcrypt.hash('Password123!', 12);

    // Create Users
    const farmer = await User.create({
      firstName: 'Boureima',
      lastName: 'Sawadogo',
      email: 'farmer@agroconnect.bf',
      phone: '+22601020304',
      passwordHash,
      role: 'FARMER',
      isVerified: true,
      city: 'Ouahigouya',
      ...getDefaultCapabilities('FARMER')
    });

    const buyer = await User.create({
      firstName: 'Moussa',
      lastName: 'Diallo',
      email: 'buyer@agroconnect.bf',
      phone: '+22605060708',
      passwordHash,
      role: 'BUYER',
      isVerified: true,
      city: 'Ouagadougou',
      address: 'Ouaga 2000, Rue 15.42',
      ...getDefaultCapabilities('BUYER')
    });

    const transporter = await User.create({
      firstName: 'Issa',
      lastName: 'Ouedraogo',
      email: 'transporter@agroconnect.bf',
      phone: '+22609101112',
      passwordHash,
      role: 'TRANSPORTER',
      isVerified: true,
      city: 'Bobo-Dioulasso',
      ...getDefaultCapabilities('TRANSPORTER')
    });

    console.log('Users created.');

    // Create Products
    const products = await Product.create([
      {
        seller: farmer._id,
        name: 'Maïs Blanc Premium',
        description: 'Maïs blanc de haute qualité, récolte 2024.',
        price: 18000,
        unit: 'sac',
        quantity: 50,
        category: 'Céréales',
        city: 'Ouahigouya',
        images: ['https://images.unsplash.com/photo-1551717743-49959800b1f6?q=80&w=500']
      },
      {
        seller: farmer._id,
        name: 'Oignons de Galmi',
        description: 'Oignons rouges frais, très parfumés.',
        price: 25000,
        unit: 'sac',
        quantity: 30,
        category: 'Légumes',
        city: 'Ouahigouya',
        images: ['https://images.unsplash.com/photo-1508747703725-71977713d540?q=80&w=500']
      },
      {
        seller: farmer._id,
        name: 'Tomates Grappes',
        description: 'Tomates fraîches produites en agriculture raisonnée.',
        price: 5000,
        unit: 'caisse',
        quantity: 10,
        category: 'Légumes',
        city: 'Ouahigouya',
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=500']
      }
    ]);

    console.log('Products created.');

    // Create an Order
    await Order.create({
      buyer: buyer._id,
      seller: farmer._id,
      product: products[0]._id,
      quantity: 5,
      unitPrice: 18000,
      totalPrice: 90000,
      status: 'PENDING',
      deliveryAddress: 'Ouaga 2000, Rue 15.42',
      deliveryCity: 'Ouagadougou',
      deliveryBudget: 5000
    });

    console.log('Sample Order created.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
